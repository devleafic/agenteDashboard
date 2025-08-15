import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import SocketContext from '../../../controladores/SocketContext';
import { Bell, CheckCircle2, XCircle, Clock, AlertCircle, Eye, User } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button as HeroButton, Tooltip, addToast, Badge, Input } from '@heroui/react';
import moment from 'moment';
const ReminderCenter = ({ open, onClose, onCountChange, onViewFolio }) => {
  const socketCtx = useContext(SocketContext);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'fired'
  const [poolingInterval, setPoolingInterval] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [query, setQuery] = useState('');

  const base = process.env.REACT_APP_CENTRALITA;

  const load = useCallback(async (retryCount = 0) => {
    if (!base) return;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 segundos
    
    try {
      setLoading(true);
      const token = window.localStorage.getItem('sdToken');
      const res = await axios.get(`${base}/reminders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 10000 // 10 segundos de timeout
      });
      
      if (res?.data?.success) {
        const all = (res.data.reminders || []).slice();
        const pending = all.filter(r => r.status === 'pending' || r.status === 'fired').length;
        const list = all
          .filter(r => filter === 'pending' ? r.status === 'pending' : r.status === 'fired')
          .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
          
        setItems(list);
        setPendingCount(pending);
        if (typeof onCountChange === 'function') onCountChange(pending);
      }
    } catch (error) {
      console.error('Error al cargar recordatorios:', error);
      if (retryCount < MAX_RETRIES) {
        // Reintentar después de un retraso
        setTimeout(() => load(retryCount + 1), RETRY_DELAY * (retryCount + 1));
      } else {
        addToast({
          title: 'Error',
          description: 'No se pudieron cargar los recordatorios. Intente nuevamente más tarde.',
          color: 'danger'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [base, filter]);

  // Helper to get an event emitter from context (supports multiple shapes)
  const getEmitter = () => {
    if (!socketCtx) return null;
    // Shapes observed in codebase: socket, connection, or direct emitter
    if (socketCtx.socket && typeof socketCtx.socket.on === 'function') return socketCtx.socket;
    if (socketCtx.connection && typeof socketCtx.connection.on === 'function') return socketCtx.connection;
    if (typeof socketCtx.on === 'function') return socketCtx;
    return null;
  };
  
  // Debug function to check socket connection
  const debugSocketConnection = useCallback(() => {
    const emitter = getEmitter();
    if (!emitter) {
      console.error('ReminderCenter: No socket emitter available');
      return false;
    }
    
    console.log('ReminderCenter: Socket connection status:', {
      connected: emitter.connected,
      id: emitter.id,
      disconnected: emitter.disconnected
    });
    
    return emitter.connected;
  }, []);

  // Función para mostrar notificación de recordatorio
  const showReminderNotification = useCallback((payload) => {
    console.log('ReminderCenter: Showing notification for reminder:', payload);
    
    // Verificar si el recordatorio ya fue mostrado recientemente (para evitar duplicados)
    const now = Date.now();
    const REMINDER_COOLDOWN = 5000; // 5 segundos de cooldown
    
    // Extraer datos del payload
    const folioId = payload?.folioId || '';
    const alias = payload?.aliasPerson || payload?.personAlias || '';
    const note = payload?.note || '';
    
    // Construir una clave única para este recordatorio
    const reminderKey = `reminder_${payload.reminderId || ''}_${now}`;
    
    // Verificar si ya mostramos una notificación similar recientemente
    const lastShown = localStorage.getItem(reminderKey);
    if (lastShown && (now - parseInt(lastShown, 10)) < REMINDER_COOLDOWN) {
      console.log('ReminderCenter: Duplicate notification suppressed');
      return;
    }
    
    // Guardar la marca de tiempo de esta notificación
    localStorage.setItem(reminderKey, now.toString());
    
    // Limpiar entradas antiguas del localStorage (más de 1 día)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('reminder_')) {
        const timestamp = parseInt(localStorage.getItem(key), 10);
        if (isNaN(timestamp) || (now - timestamp) > 86400000) { // 24 horas
          localStorage.removeItem(key);
        }
      }
    });
    
    // Mostrar notificación
    addToast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="text-warning" size={18} />
          <span>Recordatorio vencido</span>
        </div>
      ),
      description: (
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Conversación: {folioId}{alias ? ` - ${alias}` : ''}</div>
          {note && <div className="text-md">{note}</div>}
        </div>
      ),
      color: 'warning',
      duration: 15000, // 15 segundos de visibilidad
      onClose: () => {
        // Opcional: realizar alguna acción cuando se cierre la notificación
      }
    });
    
    // Reproducir sonido de notificación
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('No se pudo reproducir el sonido de notificación:', e));
    } catch (e) {
      console.log('Audio de notificación no soportado');
    }
  }, []);

  // Efecto para manejar los eventos de socket
  useEffect(() => {
    const emitter = getEmitter();
    if (!emitter) {
      console.warn('ReminderCenter: No se encontró el emisor de socket');
      return;
    }
    
    // Depurar conexión de socket
    debugSocketConnection();
    
    console.log('ReminderCenter: Configurando oyente de recordatorios');
    
    const handleReminderEvent = (payload) => {
      console.log('ReminderCenter: Evento de recordatorio recibido', payload);
      
      // Mostrar notificación al usuario
      showReminderNotification(payload);
      
      // Actualizar la lista de recordatorios
      load().catch(console.error);
      
      // Cambiar al filtro de "disparados" si el modal está abierto
      try { 
        if (open) setFilter('fired'); 
      } catch (e) {
        console.error('Error al cambiar el filtro:', e);
      }
      
      // Asegurarse de que el recordatorio se agregue a la lista incluso si load() falla
      if (payload?.reminderId) {
        setItems(prevItems => {
          // Verificar si este recordatorio ya está en la lista
          const exists = prevItems.some(item => item._id === payload.reminderId);
          if (!exists) {
            // Crear un objeto de recordatorio a partir del payload
            const newReminder = {
              _id: payload.reminderId,
              folioId: payload.folioId,
              personId: payload.personId,
              personAlias: payload.personAlias,
              aliasPerson: payload.aliasPerson,
              note: payload.note,
              dueAt: payload.dueAt || new Date().toISOString(),
              status: 'fired',
              createdAt: payload.createdAt || new Date().toISOString()
            };
            
            console.log('ReminderCenter: Añadiendo recordatorio a la lista', newReminder);
            const next = [...prevItems, newReminder];
            
            // Actualizar el contador de pendientes
            const nextCount = next.filter(item => 
              item.status === 'pending' || item.status === 'fired'
            ).length;
            
            setPendingCount(nextCount);
            if (typeof onCountChange === 'function') onCountChange(nextCount);
            
            return next;
          }
          return prevItems;
        });
      }
      
      // Abrir el centro de recordatorios si no está abierto
      if (typeof onClose === 'function' && !open) {
        console.log('ReminderCenter: Solicitando abrir el centro de recordatorios');
        onClose(true); // Señal al padre para que abra el modal
      }
    };
    
    // Registrar manejadores para ambos eventos de recordatorio
    const events = ['reminder:due', 'reminder:fire', 'reminder:created', 'reminder:updated'];
    
    // Función para registrar eventos
    const registerEventHandlers = () => {
      events.forEach(event => {
        emitter.on(event, handleReminderEvent);
        console.log(`ReminderCenter: Registrado manejador para ${event}`);
      });
    };
    
    // Registrar manejadores iniciales
    registerEventHandlers();
    
    // Configurar reconexión automática para eventos
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 5000; // 5 segundos
    
    const handleDisconnect = () => {
      console.warn('ReminderCenter: Socket desconectado, intentando reconectar...');
      
      const tryReconnect = () => {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error('ReminderCenter: Número máximo de intentos de reconexión alcanzado');
          return;
        }
        
        reconnectAttempts++;
        console.log(`ReminderCenter: Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        
        // Intentar reconectar
        if (emitter.connected) {
          console.log('ReminderCenter: Reconexión exitosa');
          registerEventHandlers();
          reconnectAttempts = 0;
          return;
        }
        
        // Volver a intentar después de un retraso
        setTimeout(tryReconnect, RECONNECT_DELAY * reconnectAttempts);
      };
      
      tryReconnect();
    };
    
    // Configurar manejadores de eventos de conexión
    emitter.on('connect', () => {
      console.log('ReminderCenter: Socket conectado');
      reconnectAttempts = 0;
      registerEventHandlers();
      // Forzar una recarga de datos después de reconectar
      load().catch(console.error);
    });
    
    emitter.on('disconnect', handleDisconnect);
    emitter.on('connect_error', (error) => {
      console.error('ReminderCenter: Error de conexión de socket:', error);
      handleDisconnect();
    });
    
    // Configurar verificación periódica de conexión
    const connectionCheckInterval = setInterval(() => {
      if (!debugSocketConnection()) {
        console.warn('ReminderCenter: La conexión de socket parece estar inactiva');
        // Intentar forzar una reconexión
        if (emitter.connect && typeof emitter.connect === 'function') {
          emitter.connect();
        }
      }
    }, 30000); // Verificar cada 30 segundos
    
    // Limpieza al desmontar el componente
    return () => {
      console.log('ReminderCenter: Limpiando manejadores de eventos');
      clearInterval(connectionCheckInterval);
      
      // Eliminar manejadores de eventos
      events.forEach(event => {
        if (typeof emitter.off === 'function') {
          emitter.off(event, handleReminderEvent);
        } else if (typeof emitter.removeListener === 'function') {
          emitter.removeListener(event, handleReminderEvent);
        }
      });
      
      // Eliminar manejadores de eventos de conexión
      if (typeof emitter.off === 'function') {
        emitter.off('connect', registerEventHandlers);
        emitter.off('disconnect', handleDisconnect);
      } else if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('connect', registerEventHandlers);
        emitter.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [socketCtx, load, debugSocketConnection, onClose]);

  // Efecto para el sistema de pooling
  useEffect(() => {
    // Limpiar intervalo existente si hay uno
    if (poolingInterval) {
      clearInterval(poolingInterval);
    }

    // Configurar nuevo intervalo si el componente está montado
    const interval = setInterval(() => {
      load().then(() => {
        setLastUpdate(Date.now());
      });
    }, 30000); // Actualizar cada 30 segundos

    setPoolingInterval(interval);

    // Cargar datos inmediatamente cuando el componente se monta o se abre
    if (open) {
      load();
    }

    // Limpiar al desmontar
    return () => {
      if (poolingInterval) {
        clearInterval(poolingInterval);
      }
    };
  }, [open, load]);

  useEffect(() => {
    // reload when filter changes if modal is open
    if (open) load();
  }, [filter]);

  const ack = async (id) => {
    try {
      const token = window.localStorage.getItem('sdToken');
      await axios.put(`${base}/reminders/${id}/ack`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      // Actualizar el estado local primero para una mejor experiencia de usuario
      setItems(prev => {
        const next = prev.filter(x => x._id !== id);
        const nextPendingCount = next.filter(item => item.status === 'pending' || item.status === 'fired').length;
        setPendingCount(nextPendingCount);
        if (typeof onCountChange === 'function') onCountChange(nextPendingCount);
        return next;
      });
      
      // Forzar una recarga para asegurar la sincronización
      await load();
      
      addToast({ 
        title: 'Recordatorio leído', 
        color: 'success',
        duration: 3000
      });
    } catch (e) {
      console.error('Error al marcar como leído:', e);
      addToast({ 
        title: 'No se pudo marcar como leído', 
        description: 'Intente nuevamente',
        color: 'danger',
        duration: 5000
      });
    }
  };

  const cancel = async (id) => {
    try {
      const token = window.localStorage.getItem('sdToken');
      await axios.put(`${base}/reminders/${id}/cancel`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setItems(prev => {
        const next = prev.filter(x => x._id !== id);
        const nextPending = next.filter(r=>r.status==='pending').length;
        setPendingCount(nextPending);
        if (typeof onCountChange === 'function') onCountChange(nextPending);
        return next;
      });
      addToast({ title: 'Recordatorio eliminado', color: 'default' });
    } catch (e) {
      addToast({ title: 'No se pudo eliminar', color: 'danger' });
    }
  };

  const cancelAll = async () => {
    if (!items.length) return;
    const pendings = items.filter(r=>r.status==='pending');
    if (!pendings.length) {
      addToast({ title: 'No hay pendientes para cancelar', color: 'default' });
      return;
    }
    if (!window.confirm(`¿Cancelar ${pendings.length} recordatorio(s) pendientes?`)) return;
    for (const r of pendings) {
      // best-effort sequential cancel
      // eslint-disable-next-line no-await-in-loop
      await cancel(r._id);
    }
    await load();
  };

  const fmtLocal = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  // Efecto para actualizar el contador cuando cambian los items
  useEffect(() => {
    if (typeof onCountChange === 'function') {
      const count = items.filter(item => item.status === 'pending' || item.status === 'fired').length;
      onCountChange(count);
    }
  }, [items, onCountChange]);

  return (
    <Modal isOpen={open} onClose={() => onClose()} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span>Centro de Recordatorios</span>
            {pendingCount > 0 && (
              <Badge color="danger" size="sm" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </div>
        </ModalHeader>
        <ModalBody>
          {/* Filters and search */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex gap-2">
              <HeroButton size="sm" color="danger" variant={filter==='fired'?'solid':'flat'} onPress={()=>setFilter('fired')}>Recordatorios</HeroButton>
              <HeroButton size="sm" color="warning" variant={filter==='pending'?'solid':'flat'} onPress={()=>setFilter('pending')}>Recordatorios por llegar</HeroButton>
            </div>
            <div className="flex items-center gap-2">
              <Input size="sm" placeholder="Buscar por folio o persona" value={query} onChange={(e)=>setQuery(e.target.value)} className="w-60"/>
              {filter==='pending' && (
                <HeroButton size="sm" color="danger" variant="flat" onPress={cancelAll}>Eliminar todos</HeroButton>
              )}
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay recordatorios pendientes
            </div>
          ) : (
            <div className="space-y-4">
              {items
                .filter(item => {
                  if (!query) return true;
                  const q = query.toLowerCase();
                  const alias = (item.aliasPerson || item.personAlias || '').toLowerCase();
                  return `${item.folioId}`.toLowerCase().includes(q) || alias.includes(q);
                })
                .map((item) => (
                <div key={item._id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                  <div className="grid grid-cols-[48px_1fr] gap-4 items-start">
                    {/* Left action column */}
                    <div className="flex flex-col gap-2 items-center pt-1">
                      <Tooltip content="Ver" placement="left">
                        <HeroButton
                          isIconOnly
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => {
                            try {
                              if (typeof onViewFolio === 'function' && item?.folioId) {
                                onViewFolio(item.folioId);
                                if (typeof onClose === 'function') onClose(false);
                              } else {
                                addToast({ title: 'No se pudo abrir', description: 'Folio inválido o acción no disponible', color: 'error' });
                              }
                            } catch (e) {
                              addToast({ title: 'Error al abrir', color: 'error' });
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </HeroButton>
                      </Tooltip>
                      <Tooltip content="Leído" placement="left">
                        <HeroButton isIconOnly size="sm" color="success" variant="light" onPress={() => ack(item._id)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </HeroButton>
                      </Tooltip>
                      <Tooltip content="Eliminar" placement="left">
                        <HeroButton isIconOnly size="sm" color="danger" variant="light" onPress={() => cancel(item._id)}>
                          <XCircle className="h-4 w-4" />
                        </HeroButton>
                      </Tooltip>
                    </div>
                    {/* Right content */}
                    <div>
                      {/* Line 1: Conversación */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Conversación: {item.folioId}</span>
                      </div>
                      {/* Line 2: Alias y Anchor */}
                      <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{(item.aliasPerson || item.personAlias || 'Sin alias')}</span>
                        {item.anchor && <span className="text-gray-500">• {item.anchor}</span>}
                      </div>
                      {/* Line 3: Nota */}
                      {item.note && (
                        <p className="mt-1 text-md text-gray-800">{`Nota: ${item.note}`}</p>
                      )}
                      {/* Line 4: Programado */}
                      <div className="mt-2 text-xs text-gray-800">
                        Programado para: {moment(item.dueAt).format('DD-MM-YYYY HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
                ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="flex flex-col gap-2">
          <div className="flex justify-between w-full">
            <HeroButton color="primary" variant="light" onPress={() => onClose()}>
              Cerrar
            </HeroButton>
            <HeroButton color="primary" onPress={() => load()}>
              Actualizar
            </HeroButton>
          </div>
          <div className="flex justify-end w-full">
            <HeroButton 
              color="secondary" 
              size="sm" 
              variant="flat" 
              onPress={() => {
                const emitter = getEmitter();
                if (!emitter) {
                  addToast({
                    title: 'Error de conexión',
                    description: 'No se pudo encontrar la conexión de socket',
                    color: 'danger'
                  });
                  return;
                }
                
                const connectionStatus = debugSocketConnection();
                
                // Test the socket by emitting a test event
                try {
                  // Show connection status
                  addToast({
                    title: 'Estado de conexión',
                    description: `Socket ${connectionStatus ? 'conectado' : 'desconectado'} (ID: ${emitter.id || 'N/A'})`,
                    color: connectionStatus ? 'success' : 'danger'
                  });
                  
                  // Try to emit a test event to verify two-way communication
                  emitter.emit('ping', {}, (response) => {
                    console.log('Socket ping response:', response);
                    addToast({
                      title: 'Prueba de socket',
                      description: 'Respuesta recibida del servidor',
                      color: 'success'
                    });
                  });
                  
                  // Simulate a reminder:due event locally for testing
                  const testReminder = {
                    reminderId: 'test-reminder-id',
                    folioId: 'test-folio-id',
                    personAlias: 'Cliente de Prueba',
                    note: 'Este es un recordatorio de prueba para verificar que las notificaciones funcionan correctamente',
                    dueAt: new Date().toISOString()
                  };
                  
                  // Call the handler directly with the test data
                  setTimeout(() => {
                    console.log('ReminderCenter: Simulating reminder:due event', testReminder);
                    addToast({
                      title: 'Simulando recordatorio',
                      description: 'Generando notificación de prueba...',
                      color: 'info'
                    });
                    
                    // Build a more informative notification
                    const folioId = testReminder?.folioId || '';
                    const contactInfo = testReminder?.personAlias ? ` - ${testReminder.personAlias}` : '';
                    const noteInfo = testReminder?.note ? `\n${testReminder.note}` : '';
                    
                    // Show toast notification with rich content and longer duration
                    addToast({
                      title: (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="text-warning" size={18} />
                          <span>Recordatorio vencido (PRUEBA)</span>
                        </div>
                      ),
                      description: (
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold">Conversación: {folioId}{contactInfo}</div>
                          {noteInfo && <div className="text-sm">{testReminder.note}</div>}
                        </div>
                      ),
                      color: 'warning',
                      duration: 15000, // 15 seconds for better visibility
                    });
                    
                    // Update the reminder list
                    load().then(() => {
                      // Increment pending count to show badge
                      setPendingCount(prev => prev + 1);
                    });
                    
                    // Add the test reminder to the items list to ensure it persists
                    setItems(prevItems => {
                      // Create a reminder object from the test data
                      const newReminder = {
                        _id: testReminder.reminderId,
                        folioId: testReminder.folioId,
                        personId: testReminder.personId,
                        personAlias: testReminder.personAlias,
                        note: testReminder.note,
                        dueAt: testReminder.dueAt,
                        status: 'pending'
                      };
                      console.log('ReminderCenter: Adding test reminder to items list', newReminder);
                      return [...prevItems, newReminder];
                    });
                    
                    // Open the reminder center
                    if (typeof onClose === 'function') {
                      onClose(true); // Signal to parent to open the modal
                    }
                  }, 1000);
                } catch (e) {
                  console.error('Socket test failed:', e);
                  addToast({
                    title: 'Error en prueba de socket',
                    description: e.message,
                    color: 'danger'
                  });
                }
              }}
            >
              Probar conexión
            </HeroButton>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReminderCenter;
