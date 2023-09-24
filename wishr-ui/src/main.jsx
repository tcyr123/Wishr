import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import App from './App.jsx';
import Items from './components/items/Items.jsx';
import Login from './components/login/Login.jsx';
import Register from './components/register/Register.jsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  }, {
    path: "items",
    element: <Items />,
  }, {
    path: "login",
    element: <Login />,
  }, {
    path: "register",
    element: <Register />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
