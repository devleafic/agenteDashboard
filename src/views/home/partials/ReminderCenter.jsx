import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import SocketContext from '../../../controladores/SocketContext';
import { Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button as HeroButton, Chip, Tooltip, addToast } from '@heroui/react';

const ReminderCenter = ({ open, onClose }) => {
  const socket = useContext(SocketContext);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const base = process.env.REACT_APP_CENTRALITA;

  const load = useCallback(async () => {
    if (!base) return;
    try {
      setLoading(true);
      const res = await axios.get(`${base}/reminders`, { params: { status: 'pending' } });
      if (res?.data?.success) setItems(res.data.reminders || []);
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    if (!socket?.connection) return;
    const handler = (payload) => {
      addToast({
        title: 'Recordatorio vencido',
        description: `Folio #${payload?.folioId || ''}`,
        color: 'warning'
      });
      load();
    };
    socket.connection.on('reminder:due', handler);
    return () => {
      socket.connection.off?.('reminder:due', handler);
    };
  }, [socket, load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const ack = async (id) => {
    try {
      await axios.put(`${base}/reminders/${id}/ack`);
      setItems(prev => prev.filter(x => x._id !== id));
      addToast({ title: 'Recordatorio reconocido', color: 'success' });
    } catch (e) {
      addToast({ title: 'No se pudo reconocer', color: 'danger' });
    }
  };

  const cancel = async (id) => {
    try {
      await axios.put(`${base}/reminders/${id}/cancel`);
      setItems(prev => prev.filter(x => x._id !== id));
      addToast({ title: 'Recordatorio cancelado', color: 'default' });
    } catch (e) {
      addToast({ title: 'No se pudo cancelar', color: 'danger' });
    }
  };

  const fmtLocal = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <Modal isOpen={open} onOpenChange={(v) => !v && onClose?.()} size="lg" backdrop="blur">
      <ModalContent>
        {(onCloseInternal) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Recordatorios
            </ModalHeader>
            <ModalBody>
              {loading && <div className="text-sm text-gray-500">Cargando...</div>}
              {!loading && (!items || items.length === 0) && (
                <div className="text-sm text-gray-500">Sin recordatorios pendientes</div>
              )}
              <div className="flex flex-col gap-3">
                {items.map((r) => (
                  <div key={r._id} className="flex items-center justify-between p-3 rounded-md border bg-white">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Folio #{r.folioId}</span>
                        {r.note && <span className="text-xs text-gray-600">{r.note}</span>}
                        <span className="text-xs text-gray-500">Vence: {fmtLocal(r.dueAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip content="Reconocer">
                        <HeroButton isIconOnly color="success" variant="flat" onPress={() => ack(r._id)}>
                          <CheckCircle2 className="w-4 h-4" />
                        </HeroButton>
                      </Tooltip>
                      <Tooltip content="Cancelar">
                        <HeroButton isIconOnly color="danger" variant="flat" onPress={() => cancel(r._id)}>
                          <XCircle className="w-4 h-4" />
                        </HeroButton>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <HeroButton variant="light" onPress={onCloseInternal}>Cerrar</HeroButton>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ReminderCenter;
