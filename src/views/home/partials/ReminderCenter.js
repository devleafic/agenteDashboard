import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import SocketContext from '../../../controladores/SocketContext';
import { Bell, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button as HeroButton, Tooltip, addToast, Badge, Input } from '@heroui/react';
import moment from 'moment';
const ReminderCenter = ({ open, onClose, onCountChange }) => {
  const socketCtx = useContext(SocketContext);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'fired'
  const [query, setQuery] = useState('');

  const base = process.env.REACT_APP_CENTRALITA;

  const load = useCallback(async () => {
    if (!base) return;
    try {
      setLoading(true);
      const token = window.localStorage.getItem('sdToken');
      // Always fetch all to compute accurate pending count and filter client-side
      const res = await axios.get(`${base}/reminders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res?.data?.success) {
        const all = (res.data.reminders || []).slice();
        const pending = all.filter(r=>r.status==='pending').length;
        const list = all
          .filter(r => filter==='pending' ? r.status==='pending' : r.status==='fired')
          .sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt));
        setItems(list);
        setPendingCount(pending);
        if (typeof onCountChange === 'function') onCountChange(pending);
      }
    } catch (_) {
      // ignore
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

  useEffect(() => {
    const emitter = getEmitter();
    if (!emitter) {
      console.warn('ReminderCenter: No socket emitter found');
      return;
    }
    
    // Debug socket connection
    debugSocketConnection();
    
    console.log('ReminderCenter: Setting up reminder:due listener');
    
    const handler = (payload) => {
      console.log('ReminderCenter: Received reminder:due event', payload);
      
      // Build a more informative notification
      const folioId = payload?.folioId || '';
      const alias = payload?.aliasPerson || payload?.personAlias;
      const contactInfo = alias ? ` - ${alias}` : '';
      const noteInfo = payload?.note ? `\n${payload.note}` : '';
      
      // Show toast notification with rich content and longer duration
      addToast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="text-warning" size={18} />
            <span>Recordatorio vencido</span>
          </div>
        ),
        description: (
          <div className="flex flex-col gap-1">
            <div className="font-semibold">Conversación: {folioId}{contactInfo}</div>
            {noteInfo && <div className="text-sm">{payload.note}</div>}
          </div>
        ),
        color: 'warning',
        duration: 15000, // 15 seconds for better visibility
      });
      
      // Play notification sound if available
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (e) {
        console.log('Audio notification not supported');
      }
      
      // Update the reminder list
      load();
      // If the modal is open, switch to 'fired' so the user sees the new reminder immediately
      try { setFilter('fired'); } catch {}
      
      // Make sure the reminder is added to the items list even if load() fails
      // This ensures the reminder persists in the notification center
      if (payload && payload.reminderId) {
        // Add the reminder to the items list if it's not already there
        setItems(prevItems => {
          // Check if this reminder is already in the list
          const exists = prevItems.some(item => item._id === payload.reminderId);
          if (!exists) {
            // Create a reminder object from the payload
            const newReminder = {
              _id: payload.reminderId,
              folioId: payload.folioId,
              personId: payload.personId,
              personAlias: payload.personAlias,
              aliasPerson: payload.aliasPerson,
              note: payload.note,
              dueAt: payload.dueAt,
              status: 'fired'
            };
            console.log('ReminderCenter: Adding reminder to items list', newReminder);
            const next = [...prevItems, newReminder];
            const nextCount = next.length;
            setPendingCount(nextCount);
            if (typeof onCountChange === 'function') onCountChange(nextCount);
            return next;
          }
          return prevItems;
        });
      }
      
      // Open the reminder center
      if (typeof onClose === 'function') {
        onClose(true); // Signal to parent to open the modal
      }
    };
    
    // Register for both reminder:due and reminder:fire events to ensure we catch all notifications
    emitter.on('reminder:due', handler);
    emitter.on('reminder:fire', handler); // Backup event name in case backend emits this instead
    
    console.log('ReminderCenter: reminder event listeners registered');
    
    // Setup a periodic connection check
    const connectionCheckInterval = setInterval(() => {
      if (!debugSocketConnection()) {
        console.warn('ReminderCenter: Socket appears disconnected, attempting to refresh connection');
        // Could implement reconnection logic here if needed
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      console.log('ReminderCenter: Cleaning up reminder event listeners');
      clearInterval(connectionCheckInterval);
      
      if (typeof emitter.off === 'function') {
        emitter.off('reminder:due', handler);
        emitter.off('reminder:fire', handler);
      } else if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('reminder:due', handler);
        emitter.removeListener('reminder:fire', handler);
      }
    };
  }, [socketCtx, load, debugSocketConnection, onClose]);

  useEffect(() => {
    if (open) {
      load();
    }
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
      setItems(prev => {
        const next = prev.filter(x => x._id !== id);
        const nextCount = next.length;
        setPendingCount(nextCount);
        if (typeof onCountChange === 'function') onCountChange(nextCount);
        return next;
      });
      addToast({ title: 'Recordatorio leído', color: 'success' });
    } catch (e) {
      addToast({ title: 'No se pudo marcar como leído', color: 'danger' });
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
                <div key={item._id} className="border rounded-lg p-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Conversación: {item.folioId}</span>
                      {(item.aliasPerson || item.personAlias) && (
                        <span className="text-sm text-gray-600">- {item.aliasPerson || item.personAlias}</span>
                      )}
                    </div>
                    {item.note && (
                      <p className="mt-1 text-md text-gray-800">{item.note ? "\nNota: " + item.note : 'Sin nota'}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-800">
                      Programado para: {moment(item.dueAt).format('DD-MM-YYYY HH:mm')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Tooltip content="Leído">
                      <HeroButton isIconOnly size="sm" color="success" variant="light" onPress={() => ack(item._id)}>
                        <CheckCircle2 className="h-4 w-4" />
                      </HeroButton>
                    </Tooltip>
                    <Tooltip content="Eliminar">
                      <HeroButton isIconOnly size="sm" color="danger" variant="light" onPress={() => cancel(item._id)}>
                        <XCircle className="h-4 w-4" />
                      </HeroButton>
                    </Tooltip>
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
