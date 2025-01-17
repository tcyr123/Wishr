import axios from "axios";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { BiChevronDown, BiChevronUp, BiSolidUserPlus, BiTrashAlt } from "react-icons/bi";
import NoProfile from "../../assets/NoProfile.png";
import { API } from "../../constants";
import { useUser } from "../../contexts/UseUser";
import TextInputsModal from "../modals/TextInputsModal";

const defaultViewer = "" // Added to reset viewer add after successful share

function Viewers({ listId }) {
    const [newViewer, setNewViewer] = useState(defaultViewer)
    const [viewerState, setViewerState] = useState('view')
    const [totalUsers, setTotalUsers] = useState()
    const [sharedUsers, setSharedUsers] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const { user } = useUser();

    useEffect(() => {
        getViewers(listId)
    }, [])

    useEffect(() => {
        if (user != null) {
            populateTotalUsers()
        }
    }, [user])

    const handleViewerChange = (event) => {
        setNewViewer(event.target?.value)
    }

    const toggleIsOpen = () => {
        setIsOpen(!isOpen)
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

    function populateTotalUsers() {
        axios.get(`${API}/users`, {
            withCredentials: true
        })
            .then(response => {
                //remove self from share list
                const filteredUsers = response.data?.filter(email => email !== user?.email);
                setTotalUsers(filteredUsers)
            })
            .catch(error => {
                console.log(error);
            })
    }

    function buildViewerForm() {
        if (viewerState != "add") { return }

        const cancelCallback = () => { setViewerState("view") }
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
                    callbackFunction: cancelCallback,
                },
                {
                    title: 'Save',
                    className: '',
                    callbackFunction: () => { addViewer(); setViewerState("view") },
                },
            ]}
            onOverlayClick={cancelCallback}
        />
    }

    function buildSharedUsers() {
        if (!sharedUsers || sharedUsers.length <= 0) {
            return (<p>Empty</p>)
        }

        return sharedUsers.map(({ shared_user }) => {
            let avatar = `${API}/image?photo=${shared_user.photo}&email=${shared_user.email}`
            return (
                <div className='message viewer' key={shared_user.email}>
                    <div style={{ flex: 1 }}>
                        <div className="profile-container">
                            <img src={avatar || NoProfile} alt={`${shared_user.email}-profile-photo`} />
                        </div>
                    </div>
                    <div className="message-info">
                        <small>{shared_user.username}</small>
                        <div className="message-metadata"></div>
                        <small>{shared_user.email}</small>
                    </div>
                    <div style={{ flex: 1 }} onClick={() => handleViewerDelete(shared_user)}>
                        <BiTrashAlt className="trash" />
                    </div>
                </div>
            )
        })
    }

    let messageClass = isOpen ? "messages" : "messages closed-tab"
    let messageContentClass = isOpen ? "" : "closed-tab-content"

    return <div className={messageClass}>
        <div onClick={toggleIsOpen} className="selectable">
            <div>{isOpen ? <BiChevronDown /> : <BiChevronUp />}</div>
            <h2>Viewers</h2>
        </div>
        <hr />
        <div className={`messages-lower-section ${messageContentClass}`}>
            <button onClick={() => { setViewerState("add") }} className='viewer-add'><BiSolidUserPlus /> Add Viewer</button>
            {buildSharedUsers()}
            {buildViewerForm()}
        </div>
    </div>
}

export default Viewers