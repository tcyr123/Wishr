import axios from "axios";
import { useEffect, useState } from "react";
import { BiCheck, BiChevronLeft, BiLink } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import NoProfile from "../../assets/NoProfile.png";
import { API, formatDateNumbers } from '../../constants';
import ScreenSizeContext from "../../contexts/ScreenSizeContext";
import useScreenSize from "../../hooks/useScreenSize";
import Nav from "../nav/Nav";
import "./Items.css";

export default function Items() {
    const screenSize = useScreenSize();
    const [items, setItems] = useState()
    const [messages, setMessages] = useState()
    const [newMsg, setNewMsg] = useState('');
    // const [userPic, setUserPic] = useState()
    const location = useLocation();
    const navigate = useNavigate();
    const isMyList = location.state.listInfo?.isMyList
    if (!location || !location.state) {
        setTimeout(() => navigate("/"), 3000)
        return (<p>No data to display... Returning to home page</p>)
    }

    useEffect(() => {
        axios.get(`${API}/items`, {
            params: {
                list_id: location.state.listInfo?.list_id
            }, withCredentials: true
        })
            .then(response => {
                setItems(response.data);
            })
            .catch(error => {
                console.log(error);
            })

        if (!isMyList) {
            axios.get(`${API}/messages`, {
                params: {
                    list_id: location.state.listInfo?.list_id
                }, withCredentials: true
            })
                .then(response => {
                    setMessages(response.data)
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }, [])

    const handleInputChange = (event) => {
        setNewMsg(event.target.value);
    };

    function buildMessages(messageList) {
        if (!messageList || messageList.length <= 0) { return <p>Empty</p> }
        const innerHtml = (
            messageList.map(message => {
                return (
                    <div className='message' key={message.id}>
                        <div className="profile-container">
                            <img src={NoProfile} alt={`${message.user_email}-profile-photo`} />
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
                return (
                    <div className='item' key={listedItem.id}>
                        {isMyList ? null : <div className="item-left">
                            <div className="item-user">
                                <div className="profile-container">
                                    <img src={NoProfile} alt={`${listedItem.assigned_user?.email}-profile-photo`} />
                                </div>
                            </div>
                            <div className="check">{listedItem.is_purchased ? <BiCheck color='green' /> : null}</div>
                        </div>}
                        <div className={listedItem.is_purchased ? "item-center strikethrough" : "item-center"}>
                            <p>{listedItem.item_name}</p>
                            <small>{listedItem.item_description}</small>
                        </div>
                        {isMyList ? null : <div className="item-right">
                            <a target="_blank" href={listedItem.link}>{listedItem.link ? <BiLink color='#4080c6' /> : null}</a>
                        </div>}
                    </div>
                )
            })
        )
        return innerHtml
    }

    return (
        <ScreenSizeContext.Provider value={screenSize}>
            <Nav />
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
                        <button className='list-add'>Add Item +</button>
                    </div>
                    {isMyList ? null :
                        <div className="messages">
                            <h2>Discussion</h2>
                            <hr />
                            <div className="messages-lower-section">
                                {buildMessages(messages)}
                            </div>
                            <div className="messages-input-container">
                                <input
                                    type="text"
                                    placeholder="Add to the discussion"
                                    value={newMsg}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>}
                </div>
            </div>
        </ScreenSizeContext.Provider>
    )
}