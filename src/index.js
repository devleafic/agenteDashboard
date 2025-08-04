import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'semantic-ui-css/semantic.min.css'
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

import ListFoliosContext from './controladores/FoliosContext';
import SocketContext from './controladores/SocketContext';
import CallContext from './controladores/CallContext';
// import { SocketProvider } from './controladores/InternalChatContext';
import { TextSizeProvider } from './contexts/TextSizeContext';

import { BrowserRouter as Router} from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";


ReactDOM.createRoot(document.getElementById("root")).render(
  <HeroUIProvider>
    <Router>
      {/* <SocketProvider> */}
        <ListFoliosContext.Provider value={{current:[]}}>
          <SocketContext.Provider value={{connection:{}}}>
            <CallContext.Provider value={{connection:{}}}>
              <TextSizeProvider>
                <App />
              </TextSizeProvider>
            </CallContext.Provider>
          </SocketContext.Provider>
        </ListFoliosContext.Provider>
      {/* </SocketProvider> */}
    </Router>
  </HeroUIProvider>
  
  //document.getElementById('root')
);