import {useState, useEffect} from 'react';
import moment from 'moment';
import {
  ModalHeader,
  ModalDescription,
  ModalContent,
  ModalActions,
  Button,
  Header,
  Image,
  Modal,
  TabPane, Tab, Icon
} from 'semantic-ui-react'

import { useSocket } from '../../controladores/InternalChatContext';

export default function ModalFiles({open, setOpen, chatId}) {

    const { goToMedia } = useSocket();

    const typesMessage = [
        {_id : 'image', title : 'Imágenes'},
        {_id : 'document', title : 'Documentos', mask : <><Icon name='folder open outline'></Icon> Documento </>}
    ]

    const [groupFiles, setGroupFiles] = useState([]);
    const [panes, setPanes] = useState([]);

    const loadMedia = async (id) => {
        const {body} = await goToMedia(id);
        const media = body.chat.messages;
        const panesToRender = media.map((itemChat) => {
            const isLabel = typesMessage.find(type => type._id === itemChat._id);

            const cardsContent = [...itemChat.messages,...itemChat.messages,...itemChat.messages].map((item) => {
                return <a href={item.message} target='_blank' style={{
                    flex: '1 1 calc(25% - 1rem)',
                    minWidth: '150px'
                }}>
                    {isLabel.mask ? isLabel.mask : <Image key={item._id} src={item.message} size='small'/>}
                    <p style={{fontSize:12}}>{
                    moment(item.createdAt).format('DD/MM/YYYY HH:mm')
                    }</p>
                </a>
            });
            return { menuItem: isLabel ? isLabel.title : itemChat._id, render: () => <TabPane>
                <div style={{ maxWidth: 800, overflow: 'hidden' }}><div style={{
                    display: 'flex',
                    flexWrap: 'wrap', 
                    gap: '1rem', 
                }}>{cardsContent}</div></div>
            </TabPane> }
        })
        console.log({media});
        setPanes(panesToRender);
    }

    useEffect(() => {
        if(groupFiles.length <= 0 && open){
            console.log('load media');
            loadMedia(chatId);
        }
    },[open]);
    

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
    >
      <ModalHeader>Contenido compartido</ModalHeader>
      <ModalContent image>
        <ModalDescription>
          <Tab panes={panes} menu={{ secondary: true, pointing: true }} />
        </ModalDescription>
      </ModalContent>
      <ModalActions>
        <Button color='black' onClick={() => setOpen(false)}>Cerrar</Button>
      </ModalActions>
    </Modal>
  )
}
