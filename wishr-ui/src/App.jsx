import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';
import Nav from './components/nav/Nav';
import { API, findLists, findSharedLists, findUser, userEmail } from './constants';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import useScreenSize from './hooks/useScreenSize';

function App() {
  const screenSize = useScreenSize();
  const [latestResponse, setLatestResponse] = useState()
  const [user, setUser] = useState()
  const [userPic, setUserPic] = useState()
  const [lists, setLists] = useState([])
  const [sharedLists, setSharedLists] = useState([])

  useEffect(() => {
    //onLoad, get all the data (temp)
    axios.get(`${API}/all`)
      .then(function (response) {
        //temporary until db is setup
        setLatestResponse(response.data)
        setUser(findUser(userEmail, response.data?.USERS))
        setLists(findLists(userEmail, response.data?.LISTS))
        setSharedLists(findSharedLists(userEmail, response.data?.SHARED, response.data?.LISTS))
      })
      .catch(function (error) {
        console.log(error);
      })
  }, [])

  useEffect(() => {
    if (user && user.photo) {
      axios.get(`${API}/image`, {
        params: {
          photo: user.photo
        },
        responseType: 'blob' //very important line
      })
        .then(function (response) {
          setUserPic(URL.createObjectURL(response.data));
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }, [user]);

  function buildLists(specifiedList) {
    if (!specifiedList || specifiedList.length <= 0) { return <p>Empty</p> }
    const innerHtml = (
      specifiedList.map(item => {
        return (
          <div className='list-title' key={`${item.title}-${item.creation_date}`}>
            <small>{findUser(item.creator, latestResponse?.USERS)?.username}</small>
            <p>{item.title}</p>
            <small>{item.creation_date}</small>
          </div>
        )
      })
    )
    return <div className={screenSize !== "mobile" ? "card" : ""}>{innerHtml}</div>
  }

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      <Nav profilePic={userPic} profileInfo={user} />
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
