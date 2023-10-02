import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import './App.css';
import Nav from './components/nav/Nav';
import { API, formatDateNumbers } from './constants';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import { useUser } from './contexts/UseUser';
import useScreenSize from './hooks/useScreenSize';

function App() {
  const screenSize = useScreenSize();
  const [lists, setLists] = useState([])
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    axios.get(`${API}/lists`, {
      withCredentials: true
    })
      .then(response => {
        setLists(response.data)
      })
      .catch(error => {
        console.log(error);
      })
  }, [])

  const handleListClick = (listInfo) => {
    navigate('/items', { state: { listInfo } })
  }

  function buildLists(specifiedList, showMyLists) {
    if (!specifiedList || specifiedList.length <= 0 || !user) {
      return <p>Empty</p>
    }

    //filters out mylist vs sharedList types based on showMyLists argument
    let output = specifiedList
      .filter((listInfo) => showMyLists ? listInfo.creator === user.email : listInfo.creator !== user.email)
      .map((listInfo) => {
        return (
          <div className='list-title' key={listInfo.list_id} onClick={() => { handleListClick(listInfo) }}>
            <small>{listInfo.username}</small>
            <p>{listInfo.title}</p>
            <small>{formatDateNumbers(listInfo.creation_date)}</small>
          </div>
        );
      });

    return output.length > 0 ? output : <p>Empty</p>
  }

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      <Nav />
      <div className='main'>
        <div className="page-title"><h1>Home</h1></div>
        <div className="lists-all-container">
          <div className="lists" >
            <h2>My Lists</h2>
            <div className={screenSize !== "mobile" ? "card" : ""}>
              {buildLists(lists, true)}
            </div >
          </div>
          <div className="lists">
            <h2>Shared Lists</h2>
            <div className={screenSize !== "mobile" ? "card" : ""}>
              {buildLists(lists, false)}
            </div>
          </div>
        </div>
        <button className='list-add'>New List +</button>
      </div>
    </ScreenSizeContext.Provider>
  )
}

export default App
