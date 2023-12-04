import React, {useContext, useEffect, useState, useRef} from 'react';
import { Tab, Grid, Message, Button, Icon, Image } from 'semantic-ui-react';
import Comments from './Comments';
import Tools from './Tools';
import axios from 'axios';


import ListFoliosContext from '../../../controladores/FoliosContext';

const HomeViewer = ({isConnected, show, refresh, setRefresh, onCall, setOnCall, userInfo, sidCall, setSidCall, dispatch, unReadFolios, countunReadMsg, dispatchCount, vFolio, setVFolio}) => {
  
  const boxMessage = useRef();
  const listFolios = useContext(ListFoliosContext);
  const [ messageToSend, setMessageToSend] = useState('');
  const [panesView, setPanesView] = useState([]);
  const [currentTab, setCurrentTab ] = useState(0);

  const [currentKeysFolios, setCurrentKeysFolios] = useState(null);
  // const [vFolio, setVFolio] = useState(null);
  
  const [toolsOpen, setToolsOpen] = useState(true);
  const [sizeCols, setSizeCols ] = useState({a:12,b:4});
  const [availableCh, setAvailableCh] = useState(null);

  const [loadPage, setLoadPage] = useState(false);

  const hideTools = () => {
    if(toolsOpen){
      setSizeCols({a:16,b:0});
      setToolsOpen(false);
      setRefresh(Math.random())
    }else{
      setSizeCols({a:12,b:4});
      setToolsOpen(true);
      setRefresh(Math.random())
    }
  }

  const getIconChannel = ({anchor, channel, alias, privateInbox, typeFolio,subject}) => {
    let ch;
    
    if(availableCh){ch = availableCh.find((x) => {
      return x.id === channel.name
    });}else{
      let plug = JSON.parse(window.localStorage.getItem('plugins'))
      ch = plug.find((x) => {
        return x.id === channel.name
      });
    }

    let aliasName = alias ? alias.substr(0,15) : anchor;
    for(let i = aliasName.length ; i < 15; i++){
      if (i == 15){
        aliasName = aliasName+'-';}
      else {
        aliasName = aliasName+' ';}
        
    }
    if (!subject) {subject = 'Sin Asunto'}
 
    let displaySubject =  subject ? subject.substr(0,25) : subject;
    for(let i = displaySubject.length ; i < 15; i++){
      if (i == 15){
        displaySubject = displaySubject+'-';}
      else {
        displaySubject = displaySubject+' ';}
    }
    let folioIcon 

    if (privateInbox){
      folioIcon =  <Icon color='red' name='inbox' /> 
    } else {
        folioIcon = typeFolio == '_EMAIL_' ? <Icon color='blue' name='envelope open' /> : 
        typeFolio == '_CALL_' ?  <Icon color='blue' name='call' /> :
        typeFolio == '_MESSAGES_' ? <Icon color='blue' name='folder open' /> : <Icon color='blue' name='folder outline' />
    }

    switch (typeFolio) {
      case '_EMAIL_' :
        return <><Image src={ch.image} style={{height : 20, marginRight : 10}} />{folioIcon} {aliasName} <br></br>{displaySubject}</>
      default:
        return <><Image src={ch.image} style={{height : 20, marginRight : 10}} />{folioIcon} {aliasName}</>
        
    }
  } 

  useEffect(  () => {
    const renderPanesViews = async () => {
      
      if(!availableCh){
        setLoadPage(true);
        const resPlugin = await axios.get(process.env.REACT_APP_CENTRALITA+'/plugins/available');
        setAvailableCh(resPlugin.data.plugins);
        
        window.localStorage.setItem('plugins', JSON.stringify(resPlugin.data.plugins));
      }
      
      let array = listFolios.current.map((x) => {return x.folio._id});
      setLoadPage(false);
      setCurrentKeysFolios(array);
      const showDefaultTab = 0;
      if(vFolio){
        let isExist = array.indexOf(vFolio);
        if(isExist <= -1){
          setVFolio(array[0])
          setCurrentTab(0);
        }else{
          setCurrentTab(isExist);
        }
      }else{
        setVFolio(array[0])
        setCurrentTab(0);
      }
      

      const tempPanes = listFolios.current.map((index) => {
        const item = index;
        return {  
          menuItem :  { key: item.folio._id, content: getIconChannel({anchor : item.folio.person.anchor, channel : item.folio.channel, alias : item.folio.person.aliasId, privateInbox: item.folio.fromInbox, typeFolio: item.folio.typeFolio, subject: item.folio?.email?.subject}), icon : (unReadFolios[item.folio._id] ? 'red circle' : 'circle outline')}, 
          tabular:true,
          render : () => {
            
            return (
            <Tab.Pane attached={true}>  
              <Grid style={{height:'calc(100vh - 138px)'}}>
                <Grid.Column width={sizeCols.a} style={{height:'100%'}}>
                    <Comments
                      person={item.folio.person}
                      messages={item.folio.message}
                      folio={item.folio}
                      fullFolio={index}
                      style={{height: '100%'}}
                      setMessageToSend={setMessageToSend}
                      messageToSend={messageToSend}
                      onCall={onCall}
                      setOnCall={setOnCall}
                      refresh={refresh}
                      setRefresh={setRefresh}
                      sidCall={sidCall}
                      setSidCall={setSidCall}
                      boxMessage={boxMessage}
                      vFolio={vFolio}
                      countunReadMsg={countunReadMsg}
                      dispatchCount={dispatchCount}
                    />
                    <Button style={{float:'right', top:'45%', position:'absolute', right:'0%', marginRight:'-13px'}} size='mini' circular icon={toolsOpen ? 'chevron right' : 'chevron left'} color='blue' onClick={hideTools}/>
              </Grid.Column>
              <Grid.Column width={sizeCols.b} style={{display: toolsOpen ? 'block' : 'none', height:'100%',}}>
                    <Tools setMessageToSend={setMessageToSend} messageToSend={messageToSend}
                      folio={item}
                      quicklyAnswer={item.QuicklyAnswer}
                      crm={item.folio.service.crm}
                      tickets={item.tickets}
                      areas={item.areas}
                      person={item.folio.person}
                      setRefresh={setRefresh}
                      historyFolios={item.historyFolios}
                      userInfo={userInfo}
                      mtm={item.mtm}
                    />
              </Grid.Column>
             </Grid>
             
           </Tab.Pane>
          )}
        }
      });
      setPanesView(tempPanes);
      return true;
    }
    renderPanesViews();

  }, [refresh, messageToSend, vFolio]);

  const getMessageEmpty = () => {
    switch(isConnected){
      case -1:
        return (<div style={{margin : 40}}><Message
          icon='plug'
          header='Aun no estas conectado, selecciona una actividad para conectarte'
          negative
        /></div>)
      case 1:
        return (<div style={{margin : 40}}><Message
          icon='envelope open outline'
          header='Listo para recibir nuevos mensajes o llamadas. Sin nueva actividad por ahora.'
          positive
        /></div>)
      case 2:
          return (<div style={{margin : 40}}><Message
            icon='clock outline'
            header='Continuas conectado, pero no recibiras nuevos mensajes o llamadas.'
            warning
          /></div>)
    }
  }


  return ( <>
    {
      !loadPage ? (listFolios.current.length > 0 ? (
        <div style={{padding: 8, height: 'calc(100vh - 79px)', display: show ? 'block' : 'none'}}>
          <Tab attached={true} className='removeMargin' menu={{ color: 'blue',attached :true, tabular : true}} panes={panesView} activeIndex={currentTab} onTabChange={(e, {activeIndex}) => {
            setVFolio(currentKeysFolios[activeIndex]);
            setMessageToSend('')
            window.localStorage.setItem('vFolio', currentKeysFolios[activeIndex])
            dispatch({type : 'read', folio : currentKeysFolios[activeIndex]})
          }}/>
        </div>) : getMessageEmpty()) : (<div style={{margin : 40}}><Message content='Cargando Página . . .' icon={<Icon loading name='spinner' />}/></div>)
    }
      
  </> );
}
 
export default HomeViewer;