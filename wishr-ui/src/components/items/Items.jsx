import axios from "axios";
import { useEffect, useState } from "react";
import NoProfile from "../../assets/NoProfile.png";
import { API, formatDate } from '../../constants';
import ScreenSizeContext from "../../contexts/ScreenSizeContext";
import useScreenSize from "../../hooks/useScreenSize";
import Nav from "../nav/Nav";
import "./Items.css";

export default function Items() {
    const screenSize = useScreenSize();
    const [messages, setMessages] = useState()
    const [newMsg, setNewMsg] = useState('');
    // const [userPic, setUserPic] = useState()

    useEffect(() => {
        //onLoad, get all the data (temp)
        axios.get(`${API}/messages`)
            .then(function (response) {
                setMessages(response.data)
            })
            .catch(function (error) {
                console.log(error);
            })
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
                                <small>{formatDate(message.date)}</small>
                            </div>
                            <p>{message.message}</p>
                        </div>

                    </div>
                )
            })
        )
        return <div className="messages-container">{innerHtml}</div>
    }

    return (
        <ScreenSizeContext.Provider value={screenSize}>
            <Nav />
            <div className='main'>
                <div className="items-page">
                    <div className="items-section">
                        <div className="item-list-title"><h1>{"List Name Here"}</h1></div>
                        <div className="items-container">
                            <p>todo: list items here</p>
                            <ul>
                                <li>thing</li>
                                <li>thing</li>
                                <li>thing</li>
                                <li>thing</li>
                                <li>thing</li>
                                <li>thing</li>
                                <li>thing</li>
                                <li>thing</li>
                                <li>thing</li>
                            </ul>
                        </div>
                        <button className='list-add'>Add Item +</button>
                    </div>
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
                    </div>
                </div>
            </div>
        </ScreenSizeContext.Provider>
    )
}