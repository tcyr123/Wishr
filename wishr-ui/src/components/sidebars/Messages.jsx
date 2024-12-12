import axios from "axios";
import { useEffect, useState } from "react";
import { BiSend } from "react-icons/bi";
import NoProfile from "../../assets/NoProfile.png";
import { API, formatDateNumbers } from "../../constants";


function Messages({ listId }) {
    const [newMsg, setNewMsg] = useState('');
    const [messages, setMessages] = useState()

    const handleInputChange = (event) => {
        setNewMsg(event.target.value);
    };

    useEffect(() => {
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

    }, [])

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


    return <div className="messages">
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
    </div>
}

export default Messages