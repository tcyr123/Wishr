import axios from "axios";
import { useEffect, useState } from "react";
import { BiCheck, BiChevronLeft, BiEditAlt, BiLink, BiSend, BiSolidUserPlus, BiTrashAlt } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import NoProfile from "../../assets/NoProfile.png";
import { API, formatDateNumbers } from '../../constants';
import ScreenSizeContext from "../../contexts/ScreenSizeContext";
import useScreenSize from "../../hooks/useScreenSize";
import "./Items.css";

const defaultItem = { title: null, description: null, link: null }

export default function Items() {
    const screenSize = useScreenSize();
    const [action, setAction] = useState('view')
    const [items, setItems] = useState()
    const [messages, setMessages] = useState()
    const [sharedUsers, setSharedUsers] = useState([])
    const [newMsg, setNewMsg] = useState('');
    const [newItem, setNewItem] = useState(defaultItem)
    // const [userPic, setUserPic] = useState()
    const location = useLocation();
    const navigate = useNavigate();
    const isMyList = location.state.listInfo?.isMyList
    const listId = location.state.listInfo?.list_id

    useEffect(() => {
        if (!location || !location.state) {
            setTimeout(() => navigate("/"), 3000);
            return (<p>No data to display... Returning to home page</p>)
        }
    }, [location, navigate]);

    useEffect(() => {
        getItems()

        if (!isMyList) {
            axios.get(`${API}/messages`, {
                params: {
                    list_id: listId
                }, withCredentials: true
            })
                .then(response => {
                    setMessages(response.data)
                })
                .catch(error => {
                    console.log(error);
                })
        } else {
            axios.get(`${API}/listSharing`, {
                params: {
                    list_id: location.state.listInfo?.list_id
                }, withCredentials: true
            })
                .then(response => {
                    setSharedUsers(response.data)
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }, [])

    const handleInputChange = (event) => {
        setNewMsg(event.target.value);
    };

    const handleItemChange = (event, key) => {
        setNewItem(current => ({ ...current, [key]: event.target.value }));
    };

    function getItems() {
        axios.get(`${API}/items`, {
            params: {
                list_id: listId
            }, withCredentials: true
        })
            .then(response => {
                setItems(response.data);
            })
            .catch(error => {
                console.log(error);
            })
    }

    function addItem() {
        if (!newItem || !newItem.title) { return }
        axios.post(`${API}/items`, {
            list_id: listId, item_name: newItem.title, item_description: newItem.description, link:
                newItem.link
        }, {
            withCredentials: true
        })
            .then(() => {
                //set good messsage notification maybe
                setNewItem(defaultItem)
                getItems()
            })
            .catch(error => {
                console.log(error);
            })
    }

    function buildMessages(messageList) {
        if (!messageList || messageList.length <= 0) { return <p>Empty</p> }
        const innerHtml = (
            messageList.map(message => {
                let avatar = `${API}/image?photo=${message.user_info?.photo}`
                return (
                    <div className='message' key={message.id}>
                        <div className="profile-container">
                            <img src={avatar || NoProfile} alt={`${message.user_email}-profile-photo`} />
                        </div>
                        <div className="message-info">
                            <div className="message-metadata">
                                <small>{message.user_info?.username}</small>
                                <small>{formatDateNumbers(message.date)}</small>
                            </div>
                            <p>{message.message}</p>
                        </div>

                    </div>
                )
            })
        )
        return <div className="messages-container">{innerHtml}</div>
    }

    function buildItems(itemsList) {
        if (!itemsList || itemsList.length <= 0) { return <p>Empty</p> }

        const innerHtml = (
            itemsList.map(listedItem => {
                let avatar_photo_name = listedItem.assigned_user?.photo;
                let avatar = avatar_photo_name ? `${API}/image?photo=${avatar_photo_name}` : null;
                return (
                    <div className='item' key={listedItem.id}>
                        {isMyList ? <div className="item-left">
                            <div onClick={(e) => { e.stopPropagation(); alert("todo: set up delete confirmation for item") }} style={{ marginRight: "20px" }}><BiTrashAlt /></div>
                            <div onClick={(e) => { e.stopPropagation(); alert("todo: set up item edit") }}><BiEditAlt /></div>
                        </div> :
                            <div className="item-left">
                                <div className="item-user">
                                    <div className="profile-container selectable" onClick={(e) => { e.stopPropagation(); alert("todo: set up assign prompt") }}>
                                        <img src={avatar || NoProfile} alt={`${listedItem.assigned_user?.email}-profile-photo`} />
                                    </div>
                                    <small>{listedItem.assigned_user?.username}</small>
                                </div>
                                <div className="check" onClick={(e) => { e.stopPropagation(); alert("todo: set up purchased checkbox") }}>{listedItem.is_purchased ? <BiCheck color='green' /> : null}</div>
                            </div>}
                        <div className={listedItem.is_purchased ? "item-center strikethrough" : "item-center"}>
                            <p>{listedItem.item_name}</p>
                            <small>{listedItem.item_description}</small>
                        </div>
                        <div className="item-right">
                            <a target="_blank" href={listedItem.link} rel="noreferrer">{listedItem.link ? <BiLink color='#4080c6' /> : null}</a>
                        </div>
                    </div>
                )
            })
        )
        return innerHtml
    }

    function buildSharedUsers() {
        if (!sharedUsers || sharedUsers.length <= 0) {
            return (<p>Empty</p>)
        }

        return sharedUsers.map(({ shared_user }) => {
            let avatar = `${API}/image?photo=${shared_user.photo}`
            return (
                <div className='message' key={shared_user.email}>
                    <div className="profile-container">
                        <img src={avatar || NoProfile} alt={`${shared_user.email}-profile-photo`} />
                    </div>
                    <div className="message-info">
                        <small>{shared_user.username}</small>
                        <div className="message-metadata"></div>
                        <small>{shared_user.email}</small>
                    </div>
                </div>
            )
        })
    }

    function buildForm() {
        if (action === "view") {
            return <button onClick={() => { setAction("add") }} className='list-add'>Add Item +</button>
        } else if (action === "add") {
            return <div className="entry-form unroll-item">
                <h2>New Item</h2>
                <form>
                    <div className="input-box" style={{ width: "fit-content", margin: "auto", marginBottom: "15px" }}>
                        <label htmlFor="itemTitle">Item Title:</label>
                        <input type="text" id="itemTitle" value={newItem?.title} placeholder='Piggy Bank' onChange={(e) => handleItemChange(e, "title")} />
                    </div>
                    <div className="input-box">
                        <label htmlFor="itemDesc">Item Description:</label>
                        <input type="text" id="itemDesc" value={newItem?.description} placeholder='Has to be small' onChange={(e) => handleItemChange(e, "description")} />
                    </div>
                    <div className="input-box">
                        <label htmlFor="username">Link:</label>
                        <input type="text" id="itemLink" value={newItem?.link} placeholder='https://...' onChange={(e) => handleItemChange(e, "link")} />
                    </div>
                    <div className="btn-box">
                        <button onClick={() => { setAction("view") }} className='list-add inverse-btn'>Cancel</button>
                        <button onClick={() => { addItem(); setAction("view") }} className='list-add'>Save</button>
                    </div>
                </form>
            </div>
        }
    }

    return (
        <ScreenSizeContext.Provider value={screenSize}>
            <div className='main'>
                <div className="items-page">
                    <div className="items-section">
                        <div className="item-list-title">
                            <h1><a onClick={() => { navigate(-1) }}><BiChevronLeft /></a>{location.state.listInfo?.title}</h1>
                        </div>
                        <div className="items-container">
                            {buildItems(items)}
                        </div>
                        <br />
                        {isMyList ? buildForm() : null}
                    </div>
                    {isMyList ?
                        <div className="messages">
                            <h2>Viewers</h2>
                            <hr />
                            <div className="messages-lower-section">
                                {buildSharedUsers()}
                                <button onClick={() => { alert("todo: setup share list") }} className='list-add'><BiSolidUserPlus />Add Viewer</button>
                            </div>
                        </div> :
                        <div className="messages">
                            <h2>Discussion</h2>
                            <hr />
                            <div className="messages-lower-section">
                                {buildMessages(messages)}
                            </div>
                            <div className="messages-input-container">
                                <div className="input-with-button">
                                    <input
                                        type="text"
                                        placeholder="Add to the discussion"
                                        value={newMsg}
                                        onChange={handleInputChange}
                                    />
                                    <button onClick={(e) => { e.stopPropagation(); alert("todo: setup sending messages") }}><BiSend /></button>
                                </div>
                            </div>
                        </div>}
                </div>
            </div>
        </ScreenSizeContext.Provider>
    )
}