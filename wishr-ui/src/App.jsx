import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import './App.css';
import { API, formatDateNumbers } from './constants';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import { useUser } from './contexts/UseUser';
import useScreenSize from './hooks/useScreenSize';

function App() {
  const screenSize = useScreenSize();
  const [action, setAction] = useState('view');
  const [lists, setLists] = useState([])
  const [newList, setNewList] = useState('');
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

  function addList() {
    console.log('posting to lists with title:', newList);
    //todo
    // axios.post(`${API}/lists`, {title: newList} ,{
    //   withCredentials: true
    // })
    //   .then(response => {
    //     setLists(response.data)
    //   })
    //   .catch(error => {
    //     console.log(error);
    //   })
  }

  function buildLists(showMyLists) {
    if (!lists || lists.length <= 0 || !user) {
      return <p>Empty</p>
    }

    //filters out mylist vs sharedList types based on showMyLists argument
    let output = lists
      .filter((listInfo) => showMyLists ? listInfo.creator === user.email : listInfo.creator !== user.email)
      .map((listInfo) => {
        return (
          <div className='list-title' key={listInfo.list_id} onClick={() => { handleListClick({ isMyList: showMyLists, ...listInfo }) }}>
            <small>{listInfo.username}</small>
            <p>{listInfo.title}</p>
            <small>{formatDateNumbers(listInfo.creation_date)}</small>
          </div>
        );
      });

    return output.length > 0 ? output : <p>Empty</p>
  }

  function buildForm() {
    if (action === "view") {
      return <button onClick={() => { setAction("add") }} className='list-add'>New List +</button>
    } else if (action === "add") {
      return <>
        <h2>New List Name</h2>
        <form>
          <div className="input-box" style={{ width: "fit-content", margin: "auto", marginBottom: "15px" }}>
            <input type="text" id="newList" value={newList} placeholder='My List' onChange={(e) => setNewList(e.target.value)} />
          </div>
          <button onClick={() => { addList(); setAction("view") }} className='list-add'>Save</button>
        </form>
      </>
    }
  }

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      <div className='main'>
        <div className="page-title"><h1>Home</h1></div>
        <div className="lists-all-container">
          <div className="lists" >
            <h2>My Lists</h2>
            <div className={screenSize !== "mobile" ? "card" : ""}>
              {buildLists(true)}
            </div >
          </div>
          <div className="lists">
            <h2>Shared Lists</h2>
            <div className={screenSize !== "mobile" ? "card" : ""}>
              {buildLists(false)}
            </div>
          </div>
        </div>
        {buildForm()}
      </div>
    </ScreenSizeContext.Provider>
  )
}

export default App
