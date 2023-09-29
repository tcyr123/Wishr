import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import './App.css';
import Nav from './components/nav/Nav';
import { API, findLists, findSharedLists, userEmail } from './constants';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import { useUser } from './contexts/UseUser';
import useScreenSize from './hooks/useScreenSize';

function App() {
  const screenSize = useScreenSize();
  const [lists, setLists] = useState([])
  const [sharedLists, setSharedLists] = useState([])
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    //onLoad, get all the data (temp)
    axios.get(`${API}/all`)
      .then(response => {
        //temporary until db is setup
        setLists(findLists(userEmail, response.data?.LISTS))
        setSharedLists(findSharedLists(userEmail, response.data?.SHARED, response.data?.LISTS))
      })
      .catch(error => {
        console.log(error);
      })
  }, [])

  useEffect(() => {
      axios.get(`${API}/lists`, {
        params: {
          email: user?.email
      }, withCredentials: true
      })
      .then(response => {
      })
      .catch(error => {
        console.log(error);
      })
  }, [user])

  const handleListClick = (listInfo) => {
    navigate('/items', { state: { listInfo } })
  }

  function buildLists(specifiedList) {
    if (!specifiedList || specifiedList.length <= 0) { return <p>Empty</p> }
    const innerHtml = (
      specifiedList.map(listInfo => {
        return (
          <div className='list-title' key={`${listInfo.title}-${listInfo.creation_date}`} onClick={() => { handleListClick(listInfo) }}>
            <small>{user ? user.username : "username"}</small>
            <p>{listInfo.title}</p>
            <small>{listInfo.creation_date}</small>
          </div>
        )
      })
    )
    return <div className={screenSize !== "mobile" ? "card" : ""}>{innerHtml}</div>
  }

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      <Nav />
      <div className='main'>
        <div className="page-title"><h1>Home</h1></div>
        <div className="lists-all-container">
          <div className="lists">
            <h2>My Lists</h2>
            {buildLists(lists)}
          </div>
          <div className="lists">
            <h2>Shared Lists</h2>
            {buildLists(sharedLists)}
          </div>
        </div>
        <button className='list-add'>New List +</button>
      </div>
    </ScreenSizeContext.Provider>
  )
}

export default App
