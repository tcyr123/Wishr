import { useEffect, useRef, useState } from "react";
import { BiChevronDown, BiChevronUp, BiSend } from "react-icons/bi";
import NoProfile from "../../assets/NoProfile.png";
import { API, formatDateNumbers, isStringEmpty, onEnterPressed, websocketDataToJSON } from "../../constants";
import { useUser } from '../../contexts/UseUser';

function Messages({ listId }) {
    const [newMsg, setNewMsg] = useState('');
    const [messages, setMessages] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const { user } = useUser();
    const ws = useRef(null);

    const handleInputChange = (event) => {
        setNewMsg(event.target.value);
    };

    const toggleIsOpen = () => {
        setIsOpen(!isOpen)
    }

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
                let avatar = `${API}/image?photo=${message.user_info?.photo}&email=${message.user_info.email}`
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

    let messageClass = isOpen ? "messages" : "messages closed-tab"
    let messageContentClass = isOpen ? "" : "closed-tab-content"

    return <div className={messageClass}>
        <div onClick={toggleIsOpen} className="selectable">
            <div>{isOpen ? <BiChevronDown /> : <BiChevronUp />}</div>
            <h2>Discussion</h2>
        </div>
        <hr />
        <div className={`messages-lower-section ${messageContentClass}`}>
            {buildMessages(messages)}
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
    </div>
}

export default Messages