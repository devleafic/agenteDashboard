import { Routes, Route } from "react-router-dom";

/* Vistas */
import Login from "./views/Login";
import Home from './views/home/Home';
import ResponseTicket from './views/tickets/ResponseTicket';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';

axios.interceptors.request.use((req) => {
    req.headers.Authorization = 'Bearer '+window.localStorage.getItem('sdToken');
    return req
  }, (error) => {console.log(error)}
);

function App() {
  return (<>


    <Routes>
        <Route path="/login"  element={<Login/>}/>
        <Route path="/" exact={true} element={<Home/>}/>
        <Route path="/ticket/:idTicket"  element={<ResponseTicket/>}/>
     </Routes>   

    <ToastContainer />
  </>);
}

export default App;
