import { useEffect, useRef, useState } from "react";
import { BiSend } from "react-icons/bi";
import NoProfile from "../../assets/NoProfile.png";
import { API, formatDateNumbers, isStringEmpty, onEnterPressed, websocketDataToJSON } from "../../constants";
import { useUser } from '../../contexts/UseUser';

function Messages({ listId }) {
    const [newMsg, setNewMsg] = useState('');
    const [messages, setMessages] = useState([])
    const { user } = useUser();
    const ws = useRef(null);

    const handleInputChange = (event) => {
        setNewMsg(event.target.value);
    };

    useEffect(() => {
        let apiToWs = API.replace('https', 'wss')
        apiToWs = API.replace('http', 'ws')
        ws.current = new WebSocket(`${apiToWs}/ws/messages?list_id=${listId}`);

        ws.current.onmessage = async (event) => {
            const wsMessage = await websocketDataToJSON(event)
            if (wsMessage?.message_type !== "SEND_MESSAGE") {
                return
            }

            setMessages((prev) => [...prev, wsMessage.data]);
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.current.onclose = () => {
            console.warn("WebSocket closed");
        };

        // Cleanup on unmount
        return () => {
            ws.current?.close();
        };
    }, [listId]);

    const sendMessageWS = () => {
        if (isStringEmpty(newMsg)) return;

        // userinfo not saved in DB. 
        // Only sending to perist basic data instead of refetching from DB
        const messagePayload = {
            list_id: listId,
            user_info: {
                photo: user?.photo,
                email: user?.email,
                username: user?.username
            },
            message: newMsg,
        };

        const wsMessage = {
            message_type: "NEW_MESSAGE",
            data: messagePayload
        }

        ws.current?.send(JSON.stringify(wsMessage));
        setNewMsg('');
    };

    function buildMessages(messageList) {
        if (!messageList || messageList.length <= 0) { return <p>Empty</p> }
        const innerHtml = (
            messageList.map((message, i) => {
                let avatar = `${API}/image?photo=${message.user_info?.photo}`
                return (
                    <div className='message' key={`${message.id}-${i}`}>
                        <div className="profile-container">
                            <img src={avatar || NoProfile} alt={`${message.user_info?.email}-profile-photo`} />
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
                    onKeyDown={(e) => onEnterPressed(e, sendMessageWS)}
                    onChange={handleInputChange}
                />
                <button onClick={sendMessageWS}><BiSend /></button>
            </div>
        </div>
    </div>
}

export default Messages