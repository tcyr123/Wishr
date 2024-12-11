import axios from "axios";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { BiCheck, BiChevronLeft, BiEditAlt, BiLink, BiSend, BiSolidUserPlus, BiTrashAlt } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import NoProfile from "../../assets/NoProfile.png";
import { API, formatDateNumbers } from '../../constants';
import ScreenSizeContext from "../../contexts/ScreenSizeContext";
import useScreenSize from "../../hooks/useScreenSize";
import TextInputsModal from "../modals/TextInputsModal";
import "./Items.css";

const defaultItem = { title: null, description: null, link: null }
const defaultViewer = "" // Added to reset viewer add after successful share

export default function Items() {
    const screenSize = useScreenSize();
    const [action, setAction] = useState('view')
    const [items, setItems] = useState()
    const [messages, setMessages] = useState()
    const [sharedUsers, setSharedUsers] = useState([])
    const [newMsg, setNewMsg] = useState('');
    const [newItem, setNewItem] = useState(defaultItem)
    const [newViewer, setNewViewer] = useState(defaultViewer)
    const [viewerState, setViewerState] = useState('view')
    const [totalUsers, setTotalUsers] = useState()
    const [modalInput, setModalInput] = useState('');
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
            getViewers(location.state.listInfo?.list_id)
            populateTotalUsers() // Used for autocomplete
        }
    }, [])

    const handleInputChange = (event) => {
        setNewMsg(event.target.value);
    };

    const handleItemChange = (event, key) => {
        setNewItem(current => ({ ...current, [key]: event.target.value }));
    };

    const handleViewerChange = (event) => {
        setNewViewer(event.target?.value)
    }

    const handleItemDelete = (listedItem) => {
        confirmAlert({
            title: "Remove Viewer",
            message: `Are you sure you want to remove ${listedItem.item_name}`,
            buttons: [
                {
                    label: "Yes",
                    onClick: () => alert("todo: handle delete item")
                },
                {
                    label: "No"
                }
            ]
        });
    }

    const handleItemEdit = (listedItem) => {
        //todo: reuse add item form or make your own
        confirmAlert({
            customUI: ({ onClose }) => (
                <div className="react-confirm-alert-body">
                    <h1>Edit Item</h1>
                    <label>Name</label>
                    <input
                        type="text"
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value)}
                        placeholder="Enter new value"
                    />
                    <div className="react-confirm-alert-button-group">
                        <button onClick={onClose}>No</button>
                        <button
                            onClick={() => {
                                alert("todo: edit item")
                                onClose();
                            }}
                        >
                            Yes
                        </button>
                    </div>
                </div>
            ),
        });
    }

    const handleViewerDelete = (viewer) => {
        confirmAlert({
            title: "Remove Viewer",
            message: `Are you sure you want to remove ${viewer.username} from your Viewers list?`,
            buttons: [
                {
                    label: "Yes",
                    onClick: () => { deleteViewer(viewer) }
                },
                {
                    label: "No"
                }
            ]
        });
    }

    function populateTotalUsers() {
        axios.get(`${API}/users`, {
            withCredentials: true
        })
            .then(response => {
                //remove self from share list
                const filteredUsers = response.data?.filter(email => email !== location.state.listInfo?.creator);
                setTotalUsers(filteredUsers)
            })
            .catch(error => {
                console.log(error);
            })
    }

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

    function addViewer() {
        if (!newViewer) { return }
        axios.post(`${API}/listViewer`, {
            shared_user: { email: newViewer, username: "", photo: "" }, list_id: listId
        }, {
            withCredentials: true
        })
            .then(() => {
                // notifications later (`Shared List With User: ${newViewer}`)
                setNewViewer(defaultViewer)
                getViewers(listId)
            })
            .catch(error => {
                console.log(error);
            })
    }

    function deleteViewer(viewer) {
        if (!viewer) { return }
        axios.delete(`${API}/listViewer`, {
            data: {
                shared_user: viewer,
                list_id: listId,
            },
            withCredentials: true,
        })
            .then(() => {
                // notifications later (`Shared List With User: ${newViewer}`)
                getViewers(listId);
            })
            .catch(error => {
                console.log(error);
            });

    }

    function getViewers(listId) {
        axios.get(`${API}/listViewer`, {
            params: {
                list_id: listId
            }, withCredentials: true
        })
            .then(response => {
                setSharedUsers(response.data);
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
        if (!itemsList || itemsList.length <= 0) { return <p key={"empty items"}>Empty</p> }

        const innerHtml = (
            itemsList.map(listedItem => {
                let avatar_photo_name = listedItem.assigned_user?.photo;
                let avatar = avatar_photo_name ? `${API}/image?photo=${avatar_photo_name}` : null;
                return (
                    <div className='item' key={listedItem.id}>
                        {isMyList ? <div className="item-left">
                            <div onClick={() => handleItemDelete(listedItem)} style={{ marginRight: "20px" }}><BiTrashAlt className="trash" /></div>
                            <div onClick={() => handleItemEdit(listedItem)}><BiEditAlt className='edit' /></div>
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
                <div className='message viewer' key={shared_user.email}>
                    <div className="profile-container">
                        <img src={avatar || NoProfile} alt={`${shared_user.email}-profile-photo`} />
                    </div>
                    <div className="message-info">
                        <small>{shared_user.username}</small>
                        <div className="message-metadata"></div>
                        <small>{shared_user.email}</small>
                    </div>
                    <div onClick={() => handleViewerDelete(shared_user)}>
                        <BiTrashAlt className="trash" />
                    </div>
                </div>
            )
        })
    }

    function buildViewerForm() {
        if (viewerState === "view") {
            return <button onClick={() => { setViewerState("add") }} className='viewer-add'><BiSolidUserPlus /> Add Viewer</button>
        } else if (viewerState === "add") {
            return <TextInputsModal
                headline="Share List"
                inputSections={[
                    {
                        labelValue: 'Viewer Email',
                        inputType: 'text',
                        textList: totalUsers,
                        id: 'viewerName',
                        value: newViewer,
                        placeholder: 'john@gmail.com',
                        onChange: (e) => handleViewerChange(e),
                    }
                ]}
                buttons={[
                    {
                        title: 'Cancel',
                        className: 'inverse-btn',
                        callbackFunction: () => { setViewerState("view") },
                    },
                    {
                        title: 'Save',
                        className: '',
                        callbackFunction: () => { addViewer(); setViewerState("view") },
                    },
                ]}
                onOverlayClick={() => setAction("view")}
            />
        }
    }

    function buildAddItem() {
        if (action === "view") {
            return <button onClick={() => { setAction("add") }}>Add Item +</button>
        } else if (action === "add") {
            return <TextInputsModal
                headline="New Item"
                inputSections={[
                    {
                        labelValue: 'Item Title',
                        inputType: 'text',
                        id: 'itemTitle',
                        value: newItem?.title,
                        placeholder: 'Piggy Bank',
                        onChange: (e) => handleItemChange(e, 'title'),
                    },
                    {
                        labelValue: 'Item Description',
                        inputType: 'text',
                        id: 'itemDesc',
                        value: newItem?.description,
                        placeholder: 'Has to be small',
                        onChange: (e) => handleItemChange(e, 'description'),
                    },
                    {
                        labelValue: 'Link',
                        inputType: 'text',
                        id: 'itemLink',
                        value: newItem?.link,
                        placeholder: 'https://...',
                        onChange: (e) => handleItemChange(e, 'link'),
                    },
                ]}
                buttons={[
                    {
                        title: 'Cancel',
                        className: 'inverse-btn',
                        callbackFunction: () => setAction('view'),
                    },
                    {
                        title: 'Save',
                        className: '',
                        callbackFunction: () => {
                            addItem();
                            setAction('view');
                        },
                    },
                ]}
                onOverlayClick={() => setAction("view")}
            />
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
                        {isMyList ? buildAddItem() : null}
                    </div>
                    {isMyList ?
                        <div className="messages">
                            <h2>Viewers</h2>
                            <hr />
                            <div className="messages-lower-section">
                                {buildSharedUsers()}
                                {buildViewerForm()}
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