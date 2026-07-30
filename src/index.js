import React from 'react';
import ReactDOM from 'react-dom/client';
/* El orden de las hojas importa y la cascada depende de el:
   1. tokens    -> las custom properties de marca (nadie antes)
   2. semantic  -> reset y tema legacy de los archivos que quedan
   3. index.css -> base de marca + overrides sobre selectores .ui.*
   4. brand     -> primitivas de identidad, siempre al final
   Los @font-face NO viven aqui sino en public/styles/fonts.css:
   css-loader de CRA intenta resolver url('/fonts/...') como modulo
   y rompe el build. */
import './styles/tokens.css';
import 'semantic-ui-css/semantic.min.css'
import './index.css';
import './styles/brand.css';

import App from './App';
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
      {/* Anclado a .light igual que adminDashboard: el tema oscuro esta
          definido en tailwind.config.js pero todavia no se envia.
          El <body> lleva la misma clase (public/index.html) para que
          modales, tooltips y dropdowns portados fuera del arbol
          tambien reciban el tema. */}
      <div className="light text-foreground bg-background">
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
      </div>
    </Router>
  </HeroUIProvider>
  
  //document.getElementById('root')
);