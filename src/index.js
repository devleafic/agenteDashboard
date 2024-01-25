import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'semantic-ui-css/semantic.min.css'
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

import ListFoliosContext from './controladores/FoliosContext';
import SocketContext from './controladores/SocketContext';
import CallContext from './controladores/CallContext';

import { BrowserRouter as Router} from "react-router-dom";


ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <ListFoliosContext.Provider value={{current:[]}}>
      <SocketContext.Provider value={{connection:{}}}>
        <CallContext.Provider value={{connection:{}}}>
          <App />
        </CallContext.Provider>
      </SocketContext.Provider>
    </ListFoliosContext.Provider>
    </Router>
  
  //document.getElementById('root')
);