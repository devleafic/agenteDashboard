import React, {useContext, useEffect, useState, useRef} from 'react';
import { Tab, Grid, Message, Button, Icon } from 'semantic-ui-react';
import Comments from './Comments';
import Tools from './Tools';


import ListFoliosContext from '../../../controladores/FoliosContext';

const HomeViewer = ({unRead, setUnRead, isConnected, show, refresh, setRefresh, onCall, setOnCall, userInfo, sidCall, setSidCall}) => {
  
  const boxMessage = useRef();
  const listFolios = useContext(ListFoliosContext);
  const [ messageToSend, setMessageToSend] = useState('');
  const [panesView, setPanesView] = useState([]);
  const [currentTab, setCurrentTab ] = useState(0);

  const [currentKeysFolios, setCurrentKeysFolios] = useState(null);
  const [vFolio, setVFolio] = useState(null);
  // listFolios.current = listFolios.current ? listFolios.current : {current : {}}
  // delete listFolios.current.current;
  const [toolsOpen, setToolsOpen] = useState(true);
  const [sizeCols, setSizeCols ] = useState({a:12,b:4});

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
 

  useEffect(() => {
    const renderPanesViews = () => {
      
      
      setCurrentKeysFolios(Object.keys(listFolios.current));
      const showDefaultTab = 0;
      if(vFolio){
        let isExist = Object.keys(listFolios.current).indexOf(vFolio);
        if(isExist <= -1){
          setVFolio(Object.keys(listFolios.current)[0])
          setCurrentTab(0);
        }else{
          setCurrentTab(isExist);
        }
      }else{
        setVFolio(Object.keys(listFolios.current)[0])
        setCurrentTab(0);
      }
      

      const tempPanes = Object.keys(listFolios.current).map((index) => {
        const item = listFolios.current[index];
        return {
          menuItem :  { key: item.folio._id, content: item.folio.person.anchor+' (#'+item.folio._id+')', icon : (unRead[item.folio._id] ? 'circle' : false)}, 
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
                      fullFolio={listFolios.current[item.folio._id]}
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
                    <Button style={{float:'right', top:'45%', position:'absolute', right:'0%', marginRight:'-13px'}} size='mini' circular icon={toolsOpen ? 'chevron right' : 'chevron left'} color='blue' onClick={hideTools}/>
              </Grid.Column>
              <Grid.Column width={sizeCols.b} style={{display: toolsOpen ? 'block' : 'none'}}>
                    <Tools setMessageToSend={setMessageToSend} messageToSend={messageToSend}
                      folio={listFolios.current[item.folio._id]}
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
          icon='plug'
          header='Aun no estas conectado, selecciona una actividad para conectarte'
          negative
        /></div>)
      case 1:
        return (<div style={{margin : 40}}><Message
          icon='envelope open outline'
          header='Listo para recibir nuevos mensajes o llamadas. Sin nuevas actividades por ahora.'
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
      Object.keys(listFolios.current).length > 0 ? (
        <div style={{padding: 8, height: 'calc(100vh - 79px)', display: show ? 'block' : 'none'}}>
          <Tab attached={true} className='removeMargin' menu={{ color: 'blue',attached :true, tabular : true}} panes={panesView} activeIndex={currentTab} onTabChange={(e, {activeIndex}) => {
            setVFolio(currentKeysFolios[activeIndex]);
            window.localStorage.setItem('vFolio', currentKeysFolios[activeIndex])
            let copyUnread = {...unRead};
            delete copyUnread[currentKeysFolios[activeIndex]]
            setUnRead(copyUnread);
            
          }}/>
        </div>) : getMessageEmpty()
    }
      
  </> );
}
 
export default HomeViewer;