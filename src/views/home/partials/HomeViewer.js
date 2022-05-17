import React, {useContext, useEffect, useState} from 'react';
import { Tab, Grid, Message, Button } from 'semantic-ui-react';
import Comments from './Comments';
import Tools from './Tools';

import ListFoliosContext from '../../../controladores/FoliosContext';

const HomeViewer = ({show, refresh, setRefresh, onCall, setOnCall, userInfo}) => {
  
  
  const listFolios = useContext(ListFoliosContext);
  const [ messageToSend, setMessageToSend] = useState('');
  const [panesView, setPanesView] = useState([]);
  const [currentTab, setCurrentTab ] = useState(0);
  

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
      

      const tempPanes = Object.keys(listFolios.current).map((index) => {
        const item = listFolios.current[index];
        return {
          menuItem : item.folio.person.anchor+' (#'+item.folio._id+')',
          render : () => {return (
            <Tab.Pane attached={false}>  
              <Grid style={{height:'calc(100vh - 184px)'}}>
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
                      setRefresh={setRefresh}
                    />
                    <Button style={{float:'right', top:'45%', position:'absolute', right:'0%', marginRight:'-13px'}} size='mini' circular icon={toolsOpen ? 'chevron right' : 'chevron left'} color='teal' onClick={hideTools}/>
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

  }, [refresh, messageToSend]);

  return ( <>
    {
      Object.keys(listFolios.current).length > 0 ? (
        <div style={{padding:40, height: 'calc(100vh - 58px)', display: show ? 'block' : 'none'}}>
          <Tab menu={{ pointing:true, color: 'green'}} panes={panesView} defaultActiveIndex={0} activeIndex={currentTab} onTabChange={(e) => {
            setCurrentTab(e.target.value)
          }}/>
        </div>) : <div style={{margin : 40}}><Message
      icon='flag checkered'
      header='Sin mensajes nuevos'
      positive
    /></div>
    }
      
  </> );
}
 
export default HomeViewer;