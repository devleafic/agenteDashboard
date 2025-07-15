import { Routes, Route } from "react-router-dom";

/* Vistas */
import Login from "./views/Login";
import Home from './views/home/Home';
import ResponseTicket from './views/tickets/ResponseTicket';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import { SocketProvider } from './controladores/InternalChatContext';
import { NotificationProvider } from './controladores/NotificationContext';
import {HeroUIProvider} from '@heroui/react'
import {ToastProvider} from "@heroui/react";

axios.interceptors.request.use((req) => {
    req.headers.Authorization = 'Bearer '+window.localStorage.getItem('sdToken');
    return req
  }, (error) => {console.log(error)}
);

function App() {
  return (<>
<HeroUIProvider>
{/* <main className="dark text-foreground bg-background"> */}
    <Routes>
        <Route path="/login"  element={<Login/>}/>
        <Route path="/" exact={true} element={<NotificationProvider><SocketProvider><Home/></SocketProvider></NotificationProvider>}/>
        <Route path="/ticket/:idTicket"  element={<ResponseTicket/>}/>
     </Routes>   
     
    <ToastContainer />
   {/* </main> */}
</HeroUIProvider>
  </>);
}

export default App;
