import axios from 'axios';
import { useEffect, useState } from 'react';
import { confirmAlert } from 'react-confirm-alert';
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
import { API, formatDateNumbers, isStringEmpty, onEnterPressed } from './constants';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import { useUser } from './contexts/UseUser';
import useScreenSize from './hooks/useScreenSize';

function App() {
  const screenSize = useScreenSize();
  const [action, setAction] = useState('view');
  const [lists, setLists] = useState([])
  const [focussedList, setFocussedList] = useState()
  const [newListName, setNewListName] = useState('');
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    getLists()
  }, [])

  const handleListClick = (listInfo) => {
    navigate('/items', { state: { listInfo } })
  }

  const handleListDelete = (listInfo) => {
    confirmAlert({
      title: "Delete List",
      message: `Are you sure you want to delete ${listInfo.title}`,
      buttons: [
        {
          label: "Yes",
          onClick: () => deleteList(listInfo.list_id)
        },
        {
          label: "No"
        }
      ]
    });
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
    if (!newListName) { return }
    axios.post(`${API}/lists`, { title: newListName }, {
      withCredentials: true
    })
      .then(() => {
        //set a good message notification maybe
        setNewListName('')
        getLists()
      })
      .catch(error => {
        console.log(error);
      })
  }

  function editList() {
    if (!newListName) { return }
    axios.put(`${API}/lists`, { id: focussedList?.list_id, title: newListName }, {
      withCredentials: true
    })
      .then(() => {
        setNewListName('')
        setFocussedList()
        getLists()
      })
      .catch(error => {
        console.log(error);
      })
  }

  function deleteList(listId) {
    if (!listId) { return }
    axios.delete(`${API}/lists`, {
      data: {
        id: listId,
      },
      withCredentials: true,
    })
      .then(() => {
        getLists();
      })
      .catch(error => {
        console.log(error);
      });
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

            {isMobileView() ? null :
              <div className="relative-overlay">
                {!isMyList || <div className="hidden-btn" onClick={(e) => { e.stopPropagation(); handleListDelete(listInfo) }}><BiTrashAlt className="trash" /></div>}
                {!isMyList || <div className="hidden-btn" onClick={(e) => { e.stopPropagation(); prepareEdit(listInfo) }}><BiEditAlt className='edit' /></div>}
                <div className="hidden-btn"><BiShow className="view" /></div>
              </div>
            }

          </div>
        );
      });

    return output.length > 0 ? output : <p>Empty</p>
  }

  function buildSwipeLists(isMyList) {
    if (!lists || lists.length <= 0 || !user) {
      return <p>Empty</p>
    }

    const leadingActions = (listInfo) => (
      <LeadingActions>
        <SwipeAction onClick={() => { prepareEdit(listInfo) }}>
          <div className="swipe-action-inner" style={{ backgroundColor: "var(--color-yellow)" }}><BiEditAlt />
          </div>
        </SwipeAction>
      </LeadingActions>
    );

    const trailingActions = (listInfo) => (
      <TrailingActions>
        <SwipeAction
          onClick={() => { handleListDelete(listInfo) }}
        >
          <div className="swipe-action-inner" style={{ backgroundColor: "var(--color-red)" }}><BiTrashAlt />
          </div>
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
            leadingActions={leadingActions(listInfo)}
            trailingActions={trailingActions(listInfo)}
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

  function prepareEdit(listInfo) {
    setFocussedList(listInfo);
    setAction("edit")
  }

  function buildForm() {
    if (!["add", "edit"].includes(action)) { return }

    let isEdit = action === "edit"
    let callback = () => { isEdit ? editList() : addList(); setAction("view") }
    let cancelCallback = () => { setNewListName(''); setAction("view") }

    if (isEdit && isStringEmpty(newListName)) {
      setNewListName(focussedList?.title)
    }

    return <TextInputsModal
      headline={isEdit ? "Edit List" : "Add List"}
      inputSections={[
        {
          labelValue: 'Title',
          inputType: 'text',
          id: 'viewerName',
          value: newListName,
          placeholder: 'My List',
          onKeyDown: (e) => onEnterPressed(e, callback),
          onChange: (e) => setNewListName(e.target.value),
        }
      ]}
      buttons={[
        {
          title: 'Cancel',
          className: 'inverse-btn',
          callbackFunction: cancelCallback,
        },
        {
          title: 'Save',
          className: '',
          callbackFunction: callback,
        },
      ]}
      onOverlayClick={cancelCallback}
    />
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
            <button style={{ marginBottom: "10px" }} onClick={() => { setAction("add") }}>Add List +</button>
            <div className={"card"}>
              {buildForm()}
              {isMobileView() ? buildSwipeLists(true) : buildLists(true)}
            </div >
          </div>
          <div className="lists">
            <h2>Shared Lists</h2>
            <div className={"card"}>
              {buildLists(false)}
            </div>
          </div>
        </div>
      </div>
    </ScreenSizeContext.Provider>
  )
}

export default App
