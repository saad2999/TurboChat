import axios from "axios"
import Routes from "./Routes";
import {UserContextProvider} from "./usercontext"; // Check the path
import React, { useContext } from 'react';




function App() {

  axios.defaults.baseURL="http://localhost:3000/";
  axios.defaults.withCredentials=true;
  return (
    <>
    <UserContextProvider>
    <Routes/>
    </UserContextProvider>
      
      
    </>
  )
}

export default App
