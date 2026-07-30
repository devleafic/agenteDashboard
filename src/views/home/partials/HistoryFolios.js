import React, { useState, useContext, useMemo } from 'react';
import { Card, CardBody, Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Search, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import moment from 'moment';
import SocketContext from './../../../controladores/SocketContext';
import MessageBubble from './MessageBubble';
import MessageBubbleEmail from './MessageBubbleEmail';

const HistoryFolios = ({ historyFolios = [] }) => {
  const [openModal, setOpenModal] = useState(false);
  const [titleModal, setTitleModal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [contentMessage, setContentMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const socket = useContext(SocketContext);

  const sortedFolios = useMemo(() => {
    const result = [...historyFolios];
    
    // Filtrar por término de búsqueda
    const filtered = searchTerm
      ? result.filter(item => 
          item._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
        )
      : result;
    
    // Ordenar
    return filtered.sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [historyFolios, searchTerm, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getFolioMessages = async (folioId) => {
    setTitleModal(`Historial de Folio #${folioId}`);
    setOpenModal(true);
    setIsLoading(true);
    
    try {
      const res = await new Promise((resolve) => {
        socket.connection.emit('getMessageHist', { folio: folioId }, resolve);
      });
      
      if (res.success) {
        const isEmail = res.folio.typeFolio === '_EMAIL_';
        const MessageComponent = isEmail ? MessageBubbleEmail : MessageBubble;
        
        setContentMessage(
          <div className={`space-y-4 p-4 ${isEmail ? 'bg-cream-100' : ''}`}>
            {res.folio.message.map((msg) => (
              <MessageComponent key={msg._id} message={msg} />
            ))}
          </div>
        );
      }
    } catch (error) {
      console.error('Error al cargar el historial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return moment(dateString).utcOffset('-06:00').format('DD/MM/YYYY HH:mm');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda */}
      <div className="p-4 bg-cream-50 border-b">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar folio o asunto..."
            startContent={<Search className="text-ink-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Encabezados de la tabla */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-medium text-ink-600 bg-cream-100 border-b">
        <div 
          className="col-span-6 flex items-center cursor-pointer hover:text-info"
          onClick={() => toggleSort('_id')}
        >
          Folio
          {sortConfig.key === '_id' && (
            <span className="ml-1">
              {sortConfig.direction === 'asc' ? <ChevronUp /> : <ChevronDown />}
            </span>
          )}
        </div>
        <div 
          className="col-span-4 flex items-center cursor-pointer hover:text-info"
          onClick={() => toggleSort('createdAt')}
        >
          Fecha
          {sortConfig.key === 'createdAt' && (
            <span className="ml-1">
              {sortConfig.direction === 'asc' ? <ChevronUp /> : <ChevronDown />}
            </span>
          )}
        </div>
        <div className="col-span-2 text-right">
          Acciones
        </div>
      </div>

      {/* Lista de folios */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
        {sortedFolios.length > 0 ? (
          <div className="divide-y divide-hair">
            {sortedFolios.map((item) => (
              <div 
                key={`hs-${item._id}`}
                className="grid grid-cols-12 gap-2 p-3 hover:bg-cream-100 cursor-pointer"
                onClick={() => getFolioMessages(item._id)}
              >
                <div className="col-span-6">
                  <div className="font-medium text-ink">#{item._id}</div>
                  {item.subject && (
                    <div className="text-sm text-ink-500 truncate" title={item.subject}>
                      {item.subject}
                    </div>
                  )}
                </div>
                <div className="col-span-4 flex items-center text-sm text-ink-600">
                  <Clock className="mr-1 flex-shrink-0" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button size="sm" variant="light" onPress={() => getFolioMessages(item._id)}>
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-ink-400">
            <X className="text-2xl mb-2" />
            <p>No se encontraron folios</p>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <Modal isOpen={openModal} scrollBehavior="inside" onOpenChange={setOpenModal} size="5xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {titleModal}
          </ModalHeader>
          <ModalBody>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info"></div>
              </div>
            ) : contentMessage ? (
              contentMessage
            ) : (
              <p>No hay información disponible</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setOpenModal(false)}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default HistoryFolios;