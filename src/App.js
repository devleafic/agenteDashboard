import { Switch, Route, BrowserRouter as Router } from "react-router-dom";

/* Vistas */
import Login from "./views/Login";
import Home from './views/home/Home';
import ResponseTicket from './views/tickets/ResponseTicket';

import axios from 'axios';

axios.interceptors.request.use((req) => {
    req.headers.Authorization = 'Bearer '+window.localStorage.getItem('sdToken');
    return req
  }, (error) => {console.log(error)}
);

function App() {
  return (
    <Router>
      <Switch>
          <Route path="/login">
            <Login />
          </Route>
          <Route path='/' exact>
            <Home />
          </Route>
          <Route path='/ticket/:idTicket' exact>
            <ResponseTicket />
          </Route>
          
      </Switch>
    </Router>
    
  );
}

export default App;
