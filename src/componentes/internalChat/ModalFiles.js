import { useState, useEffect } from 'react';
import moment from 'moment';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Tabs, Tab, Card, CardBody, Image, Snippet } from '@heroui/react';
import { FileText, Download } from 'lucide-react';
import { useSocket } from '../../controladores/InternalChatContext';

export default function ModalFiles({ open, setOpen, chatId }) {
    const { goToMedia } = useSocket();
    const [groupedFiles, setGroupedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadMedia = async (id) => {
        if (!id) return;
        setIsLoading(true);
        try {
            const { body } = await goToMedia(id);
            // The API returns groups, but we need to re-process in case the structure isn't ideal.
            const allMessages = body.chat.messages.flatMap(group => 
                group.messages.map(message => ({ ...message, groupType: group._id }))
            );

            const groups = allMessages.reduce((acc, file) => {
                const type = file.groupType || 'document'; // Default to document if type is unknown
                if (!acc[type]) {
                    acc[type] = [];
                }
                acc[type].push(file);
                return acc;
            }, {});

            setGroupedFiles(Object.entries(groups).map(([type, messages]) => ({ _id: type, messages })));

        } catch (error) {
            console.error("Error loading media:", error);
            setGroupedFiles([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadMedia(chatId);
        }
    }, [open, chatId]);

    const renderFile = (item, groupType) => {
        const isImage = groupType === 'image';
        return (
            <Card shadow="sm" key={item._id} isPressable onPress={() => window.open(item.message, '_blank')}>
                <CardBody className="overflow-visible p-0 items-center justify-center">
                    {isImage ? (
                        <Image
                            shadow="sm"
                            radius="lg"
                            width="100%"
                            alt={item.name || 'Imagen'}
                            className="w-full object-cover h-[140px]"
                            src={item.message}
                        />
                    ) : (
                        <div className="h-[140px] w-full bg-cream-100 flex flex-col items-center justify-center rounded-lg">
                            <FileText className="w-12 h-12 text-ink-500" />
                            <p className="text-xs text-center p-2 text-ink-600 break-all">{item.name || 'Documento'}</p>
                        </div>
                    )}
                </CardBody>
                <div className="p-2 flex flex-col items-start">
                    <Snippet symbol="" size="sm" variant="bordered" className="w-full overflow-hidden">{item.message}</Snippet>
                    <time className="text-xs text-ink-500 mt-1">{moment(item.createdAt).format('DD/MM/YYYY HH:mm')}</time>
                </div>
            </Card>
        );
    };

    return (
        <Modal size="4xl" isOpen={open} onClose={() => setOpen(false)} scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Contenido Compartido</ModalHeader>
                        <ModalBody>
                            {isLoading ? (
                                <p>Cargando...</p>
                            ) : (
                                <Tabs aria-label="Tipos de archivo" items={groupedFiles}>
                                    {(group) => (
                                        <Tab key={group._id} title={group._id.charAt(0).toUpperCase() + group._id.slice(1)}>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                                                {group.messages.map(item => renderFile(item, item.groupType))}
                                            </div>
                                        </Tab>
                                    )}
                                </Tabs>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
