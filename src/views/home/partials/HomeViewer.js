import React, {useContext, useEffect, useState, useRef} from 'react';
import { Tab, Grid, Message, Button, Icon, Image } from 'semantic-ui-react';
import Comments from './Comments';
import Tools from './Tools';
import axios from 'axios';


import ListFoliosContext from '../../../controladores/FoliosContext';

const HomeViewer = ({isConnected, show, refresh, setRefresh, onCall, setOnCall, userInfo, sidCall, setSidCall, dispatch, unReadFolios}) => {
  
  const boxMessage = useRef();
  const listFolios = useContext(ListFoliosContext);
  const [ messageToSend, setMessageToSend] = useState('');
  const [panesView, setPanesView] = useState([]);
  const [currentTab, setCurrentTab ] = useState(0);

  const [currentKeysFolios, setCurrentKeysFolios] = useState(null);
  const [vFolio, setVFolio] = useState(null);
  
  const [toolsOpen, setToolsOpen] = useState(true);
  const [sizeCols, setSizeCols ] = useState({a:12,b:4});
  const [availableCh, setAvailableCh] = useState(null);

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

  const getIconChannel = ({anchor, channel, alias}) => {
    let ch;
    
    if(availableCh){ch = availableCh.find((x) => {
      return x.id === channel.name
    });}else{
      let plug = JSON.parse(window.localStorage.getItem('plugins'))
      ch = plug.find((x) => {
        return x.id === channel.name
      });
    }

    let aliasName = alias ? alias.substr(0,13) : anchor;
    for(let i = aliasName.length ; i < 13; i++){
      aliasName = aliasName+'_';
    }
    return <><Image src={ch.image} style={{height : 20, marginRight : 10}} /> {aliasName}</>
  } 

  useEffect(() => {
    const renderPanesViews = async () => {
      if(!availableCh){
        const resPlugin = await axios.get(process.env.REACT_APP_CENTRALITA+'/plugins/available');
        setAvailableCh(resPlugin.data.plugins);
        window.localStorage.setItem('plugins', JSON.stringify(resPlugin.data.plugins));
      }
      
      let array = listFolios.current.map((x) => {return x.folio._id});
      
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
          menuItem :  { key: item.folio._id, content: getIconChannel({anchor : item.folio.person.anchor, channel : item.folio.channel, alias : item.folio.person.aliasId}), icon : (unReadFolios[item.folio._id] ? 'circle' : false)}, 
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
                    />
                    <Button style={{float:'right', top:'45%', position:'absolute', right:'0%', marginRight:'-13px'}} size='mini' circular icon={toolsOpen ? 'chevron right' : 'chevron left'} color='teal' onClick={hideTools}/>
              </Grid.Column>
              <Grid.Column width={sizeCols.b} style={{display: toolsOpen ? 'block' : 'none'}}>
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
    return renderPanesViews();

  }, [refresh, messageToSend, vFolio]);

  const getMessageEmpty = () => {
    switch(isConnected){
      case -1:
        return (<div style={{margin : 40}}><Message
          icon='user cancel'
          header='Aun no estas conectado, selecciona una actividad para conectarte'
          negative
        /></div>)
      case 1:
        return (<div style={{margin : 40}}><Message
          icon='flag checkered'
          header='Sin mensajes nuevos'
          positive
        /></div>)
      case 2:
          return (<div style={{margin : 40}}><Message
            icon='clock outline'
            header='Estas en linea sin embargo no recibirás mensajes'
            warning
          /></div>)
    }
  }


  return ( <>
    {
      listFolios.current.length > 0 ? (
        <div style={{padding: 8, height: 'calc(100vh - 79px)', display: show ? 'block' : 'none'}}>
          <Tab attached={true} className='removeMargin' menu={{ color: 'green',attached :true, tabular : true}} panes={panesView} activeIndex={currentTab} onTabChange={(e, {activeIndex}) => {
            setVFolio(currentKeysFolios[activeIndex]);
            window.localStorage.setItem('vFolio', currentKeysFolios[activeIndex])
            dispatch({type : 'read', folio : currentKeysFolios[activeIndex]})
          }}/>
        </div>) : getMessageEmpty()
    }
      
  </> );
}
 
export default HomeViewer;