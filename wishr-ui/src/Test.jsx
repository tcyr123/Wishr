import axios from 'axios';
import { useState } from 'react';
import './App.css';
import Nav from './components/nav/Nav';
import { API } from './constants';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import useScreenSize from './hooks/useScreenSize';

function Test() {
  const screenSize = useScreenSize();
  const [messageID, setMessageID] = useState()

  function addMessage(messageData) {
    axios.post(`${API}/messages`, messageData, { withCredentials: true })
      .then(response => {
        setMessageID(response.data?.id);
      })
      .catch(error => {
        console.log(error);
      });
  }

  function editMessage(updatedMessageData) {
    if (!updatedMessageData.id) {
      alert("no message id")
    }
    axios.put(`${API}/messages`, updatedMessageData, { withCredentials: true })
      .then(response => {

      })
      .catch(error => {
        console.log(error);
      });
  }

  //send all data so that if we ever create an auto-logger on the backend we will know what was deleted, not just "id: 4"
  function deleteMessage(messageData) {
    if (!messageData.id) {
      alert("no message id")
    }
    axios.delete(`${API}/messages`, {
      data: messageData,
      withCredentials: true
    })
      .then(response => {

      })
      .catch(error => {
        console.log(error);
      });
  }

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      <Nav />
      <div className='main'>
        <div className="page-title"><h1>Testing Page</h1></div>
        <h3>Start in order and watch the network/db. We will be inserting, editing, then deleting a message for list 3</h3>
        <div style={{ display: 'flex', justifyContent: "space-evenly" }}>
          <button onClick={() => { addMessage({ list_id: 3, message: "this is a test" }) }}>ADD MSESAGE</button>
          <button onClick={() => { editMessage({ id: messageID, message: "this is an edit test" }) }}>EDIT MSESAGE</button>
          <button onClick={() => { deleteMessage({ id: messageID }) }}>DELETE MSESAGE</button>
        </div>
      </div>
    </ScreenSizeContext.Provider>
  )
}

export default Test
