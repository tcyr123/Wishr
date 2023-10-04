import axios from 'axios';
import { useState } from 'react';
import './App.css';
import { API } from './constants';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import useScreenSize from './hooks/useScreenSize';

function Test() {
  const screenSize = useScreenSize();
  const [messageID, setMessageID] = useState();
  const [itemID, setItemID] = useState()
  const [listID, setListID] = useState()

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
      return
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
      return
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

  function addItem(itemData) {
    axios.post(`${API}/items`, itemData, { withCredentials: true })
      .then(response => {
        setItemID(response.data?.id);
      })
      .catch(error => {
        console.log(error);
      });

  }

  function editItem(updatedItemData) {
    if (!updatedItemData.id) {
      alert("no item id")
      return
    }
    axios.put(`${API}/items`, updatedItemData, { withCredentials: true })
      .then(response => {

      })
      .catch(error => {
        console.log(error);
      });
  }

  function deleteItem(itemData) {
    if (!itemData.id) {
      alert("no item id")
      return
    }
    axios.delete(`${API}/items`, {
      data: itemData,
      withCredentials: true
    })
      .then(response => {

      })
      .catch(error => {
        console.log(error);
      });
    
  }


  function addList (listData) {
    axios.post(`${API}/lists`, listData, { withCredentials: true })
      .then(response => {
        setListID(response.data?.id);
      })
      .catch(error => {
        console.log(error);
      });
  }

  function editList(updatedListData) {
    if (!updatedListData.id) {
      alert("no list id")
      return
    }
    axios.put(`${API}/lists`, updatedListData, { withCredentials: true })
      .then(response => {

      })
      .catch(error => {
        console.log(error);
      });
    
  }

  function deleteList(listData) {
    if (!listData.id) {
      alert("no list id")
      return
    }
    axios.delete(`${API}/lists`, {
      data: listData,
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
      <div className='main'>
        <div className="page-title"><h1>Testing Page</h1></div>
        <h3>Start in order and watch the network/db. We will be inserting, editing, then deleting a message for list 3</h3>
        <div style={{ display: 'flex', justifyContent: "space-evenly" }}>
          <button onClick={() => { addMessage({ list_id: 3, message: "this is a test" }) }}>ADD MESSAGE</button>
          <button onClick={() => { editMessage({ id: messageID, message: "this is an edit test" }) }}>EDIT MESSAGE</button>
          <button onClick={() => { deleteMessage({ id: messageID }) }}>DELETE MESSAGE</button>
        </div>

        <h3>Item Insert,Edit, Delete Tests</h3>
        <div style={{ display: 'flex', justifyContent: "space-evenly" }}>
          <button onClick={() => { addItem({list_id: 4, item_name: "Racecar", item_description: "Red with white stripes!", link: "https://www.bestbuy.com/site/v-bucks-19-99-card/6426792.p?skuId=6426792"}) }}>ADD ITEM</button>

          <button onClick={() => { editItem({id: itemID, item_name: "Edited Racecar", link: "https://www.walmart.com/ip/Sharper-Image-RC-Chevrolet-Corvette-1-16-Scale-Model-2-4-Ghz-Red-with-LED-Lights/480839741?wmlspartner=wlpa&selectedSellerId=0&wl13=1348&gclsrc=aw.ds&adid=22222222237480839741_147065891000_19306515553&wl0=&wl1=g&wl2=c&wl3=641985053261&wl4=pla-1568693663413&wl5=9010087&wl6=&wl7=&wl8=&wl9=pla&wl10=8175035&wl11=local&wl12=480839741&veh=sem&gclid=EAIaIQobChMIstPflcPdgQMVlFRHAR318AAtEAQYASABEgIZXPD_BwE", assigned_user:{email: "taylor@gmail.com"}, is_purchased: true}) }}>EDIT ITEM</button>

          <button onClick={() => { deleteItem({id: itemID}) }}>DELETE ITEM</button>
        </div>

        <h3>List Insert,Edit, Delete Tests</h3>
        <div style={{ display: 'flex', justifyContent: "space-evenly" }}>
          <button onClick={() => { addList({title: "Cookout Food List"}) }}>ADD LIST</button>
          <button onClick={() => { editList({id: listID, title: "Edited Cookout List"}) }}>EDIT LIST</button>
          <button onClick={() => { deleteList({id: listID}) }}>DELETE LIST</button>
        </div>
      </div>
    </ScreenSizeContext.Provider>
  )
}

export default Test
