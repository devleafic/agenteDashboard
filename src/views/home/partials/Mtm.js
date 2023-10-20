import React, {useState, useEffect, useContext} from 'react';
import {List, Image, Icon, Loader, Modal, Segment, Dimmer,Label, Button , Header, Message} from 'semantic-ui-react';
import shortParagraph from './../../../img/short-paragraph.png';
import { toast } from 'react-toastify';

// Contexto 
import SocketContext from './../../../controladores/SocketContext';
import ListFoliosContext from '../../../controladores/FoliosContext';

const Mtm = ({mtm, person, setRefresh, folio}) => {

    const initializeMtmToSend= {...mtmToSend, _id : null, name: null, text : null, locale: null, service :null, channel :null };
    const [openModal, setOpenModal] = useState(false);
    const [titleModal, setTitleModal ] = useState('');
    const [contentMessage, setContentMessage] = useState(<Segment> <Dimmer active inverted> <Loader inverted>Cargando</Loader></Dimmer><Image src={shortParagraph} /></Segment>);
    const [onLoading, setOnLoading] = useState(false);
    const socket = useContext(SocketContext);
    const listFolios = useContext(ListFoliosContext);
    const [mtmToSend, setMtmToSend] = useState({_id: null, name: null, text : null, locale : null, service : null, channel: null});

    const initLoadModal = () => { //reset values for Modal 
        setOpenModal(!openModal);
        setMtmToSend(initializeMtmToSend);
        setContentMessage(<Segment> <Dimmer active inverted> <Loader inverted>Cargando</Loader></Dimmer><Image src={shortParagraph} /></Segment>);
        console.log(mtmToSend)
    }
    const getMtm = (mtm) => {
        setTitleModal('Plantillas de mensajes')
        setOpenModal(!openModal);

        socket.connection.emit('getMtmDetail', {mtm}, (res) => {
            if(res.success){
                setMtmToSend({...mtmToSend, _id : res.mtm._id, name: res.mtm.name, text : res.mtm.previewtxt, locale : res.mtm.locale, service : res.mtm.service, channel : res.mtm.channel, parameters: res.mtm.parameters,  parametersHeader: res.mtm.parametersHeader })
                setContentMessage(
                    <div>
                        {
                            <Label size='big' as='a' color='blue'  pointing='below' >{res.mtm.previewtxt}</Label>
                        }
                    </div> 
                )
            }else{
                {
                    setContentMessage(<Label as='a' color='red'>{res.mtm.messages}</Label>)
                }
            }
        })
    }
    const execSendMtm = (mtm) => {
        setOnLoading(true);

        if(!mtm.name){
            return false;
        }
        //if parameters 
        let parameters= [], parametersHeader = {}
    /*if (mtm.parameters.length > 0){

        /*}parameters = [
                    {
                        type: "text",
                        text: "Gabriel"
                    }, {
                        type: "text",
                        text: "25OFF"
                    }, {
                        type: "text",
                        text: "Feliz tarde"
                    }
        ]
            parameters =   mtm.parameters.map((item) => {
                return {type: item.type, text: 'Mi variable' }
            })
        } 
        if (mtm.parametersHeader.length > 0){

            parametersHeader = 
                        {
                            headerType: mtm.parametersHeader[0].type,
                            header: "https://scontent.fgua3-4.fna.fbcdn.net/v/t45.1600-4/387468240_120201219876720170_7656494677333266014_n.jpg?stp=cp0_dst-jpg_q75_s1080x2048_spS444&_nc_cat=110&ccb=1-7&_nc_sid=528f85&_nc_ohc=AFXzlDjq8tsAX8XtEJJ&_nc_ht=scontent.fgua3-4.fna&oh=00_AfDy3UJUr2rcRkmsUFhsIiNFhsRqZduWQWgtmg3mp8TL_w&oe=6537021B"
                        }
            
               
        }
        */
        socket.connection.emit('sendMessage', {
            token : window.localStorage.getItem('sdToken'),
            folio :  folio.folio._id,
            message : mtm.name,
            caption : mtm.text,
            responseTo : null,
            locale :  mtm.locale,
            class : 'mtm',
            interaction : parameters,
            header : parametersHeader && parametersHeader.header ? parametersHeader.header : null,
            headerType : parametersHeader &&  parametersHeader.headerType ? parametersHeader.headerType : null,
            
        }, (result) => {

            if(!result.body.success){
                toast.error(result.body.message);
                initLoadModal();
                setMtmToSend(initializeMtmToSend)
                setOnLoading(false);
                return false;
            }
            let index = listFolios.current.findIndex((x) => {return x.folio._id === folio.folio._id});
            listFolios.current[index].folio.message.push(result.body.lastMessage);
            setOnLoading(false);
            listFolios.currentBox.scrollTop = listFolios.currentBox.scrollHeight
            
        })
        setRefresh(Math.random());
        initLoadModal();
        setMtmToSend(initializeMtmToSend)
        setOnLoading(false);
        //});
        toast.info('Enviando Plantilla... 📨', {

            position: "bottom-left",
            autoClose: 2700,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false
            });
    }
    
    useEffect(() => {
        setMtmToSend(initializeMtmToSend);
        console.log('refrescando componente de mtm')},
    [person])

   return (<>
        {
            mtm.length <= 0 && <Message icon='ban' compact floating negative content='No existen plantillas configuradas.'/>
        }
        <div style={{height:250, overflowY:'scroll'}}>
            <List >
                {
                    mtm.map((item) => {
                        return (<List.Item key={'mtm-'+item._id} href='#' onClick={(e) => {getMtm(item._id);}} title={item.previewtxt}>{item.name}</List.Item>);
                    })
                }
            </List>
        </div>
        <Modal
            basic
            onClose={() => initLoadModal()}
            onOpen={() => setOpenModal(true)}
            open={openModal}
            size='small'
            >
            <Header icon>
                <Icon name='paper plane' />
                Enviar Plantilla
            </Header>
            <Modal.Content>
                <center>
                {contentMessage}  
                ¿Deseas enviar la plantilla <b>{mtmToSend.name}</b> al usuario <b>"{person.aliasId ? person.aliasId: person.anchor}"</b> ?
                </center>
            </Modal.Content>
            <Modal.Actions>
                <Button basic color='red' inverted onClick={() => initLoadModal()}   loading={onLoading} disabled={onLoading}>
                    <Icon name='remove' /> No
                </Button>
                <Button color='blue' inverted onClick={() => execSendMtm(mtmToSend)} loading={onLoading} disabled={onLoading}>
                    <Icon name='paper plane' /> Enviar
                </Button>
            </Modal.Actions>
            </Modal>

    </>);
}
 
export default Mtm;