import axios from 'axios';
import { useEffect, useState } from 'react';
import { BiEditAlt, BiShow, BiTrashAlt } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import {
  LeadingActions,
  Type as ListType,
  SwipeableList, SwipeableListItem,
  SwipeAction,
  TrailingActions
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import './App.css';
import TextInputsModal from './components/modals/TextInputsModal';
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
    getLists()
  }, [])

  const handleListClick = (listInfo) => {
    navigate('/items', { state: { listInfo } })
  }

  function getLists() {
    axios.get(`${API}/lists`, {
      withCredentials: true
    })
      .then(response => {
        setLists(response.data)
      })
      .catch(error => {
        console.log(error);
      })
  }

  function addList() {
    if (!newList) { return }
    axios.post(`${API}/lists`, { title: newList }, {
      withCredentials: true
    })
      .then(response => {
        //set a good message notification maybe
        setNewList('')
        getLists()
      })
      .catch(error => {
        console.log(error);
      })
  }

  function buildLists(isMyList) {
    if (!lists || lists.length <= 0 || !user) {
      return <p>Empty</p>
    }

    //filters out mylist vs sharedList types based on showMyLists argument
    let output = lists
      .filter((listInfo) => isMyList ? listInfo.creator === user.email : listInfo.creator !== user.email)
      .map((listInfo) => {
        return (
          <div className='list-title more-bottom' key={listInfo.list_id} onClick={() => { handleListClick({ isMyList: isMyList, ...listInfo }) }}>
            <small>{listInfo.username}</small>
            <p>{listInfo.title}</p>
            <small>{formatDateNumbers(listInfo.creation_date)}</small>
            <div className="relative-overlay">
              {!isMyList || <div className="hidden-btn" onClick={(e) => { e.stopPropagation(); alert("todo: set up delete confirmation") }}><BiTrashAlt className="trash" /></div>}
              {!isMyList || <div className="hidden-btn" onClick={(e) => { e.stopPropagation(); alert("todo: set up list name edit") }}><BiEditAlt className='edit' /></div>}
              <div className="hidden-btn"><BiShow /></div>
            </div>
          </div>
        );
      });

    return output.length > 0 ? output : <p>Empty</p>
  }

  function buildSwipeLists(isMyList) {
    if (!lists || lists.length <= 0 || !user) {
      return <p>Empty</p>
    }

    const leadingActions = () => (
      <LeadingActions>
        <SwipeAction onClick={() => console.info('swipe action triggered')}>
          <div className="swipe-action" style={{ backgroundColor: "orange" }}>Edit</div>
        </SwipeAction>
      </LeadingActions>
    );

    const trailingActions = () => (
      <TrailingActions>
        <SwipeAction
          onClick={() => console.info('swipe action triggered')}
        >
          <div className="swipe-action" style={{ backgroundColor: "red" }}>Delete</div>
        </SwipeAction>
      </TrailingActions>
    );

    //filters out mylist vs sharedList types based on showMyLists argument
    let output = lists
      .filter((listInfo) => isMyList ? listInfo.creator === user.email : listInfo.creator !== user.email)
      .map((listInfo) => {
        return (
          <SwipeableListItem
            className='more-bottom noselect'
            key={listInfo.list_id}
            leadingActions={leadingActions()}
            trailingActions={trailingActions()}
            onClick={() => { handleListClick({ isMyList: isMyList, ...listInfo }) }}
          >
            <div className='list-title' key={listInfo.list_id}>
              <small>{listInfo.username}</small>
              <p>{listInfo.title}</p>
              <small>{formatDateNumbers(listInfo.creation_date)}</small>
            </div>
          </SwipeableListItem>
        );
      });

    return output.length > 0 ? <SwipeableList fullSwipe={true}
      type={ListType.IOS} threshold={0.5}>{output}</SwipeableList> : <p>Empty</p>
  }

  function buildForm() {
    if (action === "view") {
      return <button onClick={() => { setAction("add") }} className='list-add'>New List +</button>
    } else if (action === "add") {
      return <TextInputsModal
        headline="New List"
        inputSections={[
          {
            labelValue: 'Title',
            inputType: 'text',
            id: 'viewerName',
            value: newList,
            placeholder: 'My List',
            onChange: (e) => setNewList(e.target.value),
          }
        ]}
        buttons={[
          {
            title: 'Cancel',
            className: 'list-add inverse-btn',
            callbackFunction: () => { setAction("view") },
          },
          {
            title: 'Save',
            className: 'list-add',
            callbackFunction: () => { addList(); setAction("view") },
          },
        ]}
      />
    }
  }

  function isMobileView() {
    return screenSize === "mobile"
  }

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      <div className='main'>
        <div className="page-title"><h1>Home</h1></div>
        <div className="lists-all-container">
          <div className="lists" >
            <h2>My Lists</h2>
            <div className={!isMobileView() ? "card" : ""}>
              {isMobileView() ? buildSwipeLists(true) : buildLists(true)}
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
