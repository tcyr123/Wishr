import Cookies from 'js-cookie';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Navigate,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import App from './App.jsx';
import Test from './Test.jsx';
import Items from './components/items/Items.jsx';
import Login from './components/login/Login.jsx';
import Nav from "./components/nav/Nav.jsx";
import Register from './components/register/Register.jsx';
import { UserProvider } from './contexts/UseUser.jsx';
import './index.css';

const PrivateRoute = ({ children }) => {
  let token = Cookies.get('session_token');
  console.log('token is: ', token);
  return (
    token ? children : <Navigate to={"/login"} />
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <PrivateRoute>
      <Nav >
        <App />
      </Nav>
    </PrivateRoute>,
  }, {
    path: 'items',
    element: <PrivateRoute>
      <Nav >
        <Items />
      </Nav>
    </PrivateRoute>,
  }, {
    path: 'test',
    element: <PrivateRoute>
      <Nav >
        <Test />
      </Nav>
    </PrivateRoute>,
  }, {
    path: 'login',
    element: <Login />,
  }, {
    path: 'register',
    element: <Register />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <UserProvider>
    <RouterProvider router={router} />
  </UserProvider>
  // </React.StrictMode> 
)
