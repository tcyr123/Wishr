import axios from "axios";
import { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { BiChevronLeft, BiEditAlt, BiLink, BiTrashAlt } from "react-icons/bi";
import { IoBagCheckOutline } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { LeadingActions, Type as ListType, SwipeableList, SwipeableListItem, SwipeAction, TrailingActions } from "react-swipeable-list";
import 'react-swipeable-list/dist/styles.css';
import NoProfile from "../../assets/NoProfile.png";
import { API, handleFieldChange, isCompletelyEmpty, isStringEmpty, onEnterPressed } from '../../constants';
import { useAlert } from "../../contexts/Alert";
import ScreenSizeContext from "../../contexts/ScreenSizeContext";
import { useUser } from "../../contexts/UseUser";
import useScreenSize from "../../hooks/useScreenSize";
import LogoHeader from "../header/LogoHeader";
import TextInputsModal from "../modals/TextInputsModal";
import Messages from "../sidebars/Messages";
import Viewers from "../sidebars/Viewers";
import "./Items.css";

const defaultItem = { title: null, description: null, link: null }
function Items() {
    const screenSize = useScreenSize();
    const [action, setAction] = useState('view')
    const [items, setItems] = useState()
    const [newItem, setNewItem] = useState(defaultItem)
    const [focussedItem, setFocussedItem] = useState();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();
    const { showAlert } = useAlert();
    const [alertInfo, setAlertInfo] = useState(null);
    const isMyList = location.state.listInfo?.isMyList
    const listId = location.state.listInfo?.list_id
    const isSwipeable = isMobileView() && isMyList

    useEffect(() => {
        if (!location || !location.state) {
            setTimeout(() => navigate("/"), 3000);
            return (<p>No data to display... Returning to home page</p>)
        }
    }, [location, navigate]);

    useEffect(() => {
        getItems()
    }, [])

    useEffect(() => {
        if (alertInfo) {
            showAlert(alertInfo.message, alertInfo.type);
            setAlertInfo(null); // Reset alert state to avoid repeated calls
        }
    }, [alertInfo, showAlert]);

    const handleItemDelete = (listedItem) => {
        confirmAlert({
            title: "Remove Item",
            message: `Are you sure you want to remove ${listedItem.item_name}`,
            buttons: [
                {
                    label: "Yes",
                    onClick: () => deleteItem(listedItem.id)
                },
                {
                    label: "No"
                }
            ]
        });
    }

    const handleEditSection = (listedItem) => {
        setFocussedItem(listedItem);
        setAction("edit")
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
                reset()
            })
            .catch(error => {
                console.log(error);
            })
    }

    //only updates core 3 (title, desc, link)
    function editItemBasic() {
        if (!newItem || !newItem.title) { return }

        axios.put(`${API}/items`, {
            id: focussedItem.id,
            list_id: focussedItem.list_id,
            item_name: newItem.title,
            item_description: newItem.description,
            link: newItem.link,
        }, {
            withCredentials: true
        })
            .then(() => {
                reset()
            })
            .catch(error => {
                console.log(error);
            })
    }

    //only updates assigned_to and is_purchased properties
    function editItemAssignment() {
        if (!focussedItem) { return }

        let assignedEmail = focussedItem.assigned_user?.email;
        let isPurchased = focussedItem.is_purchased;
        if (isPurchased && isStringEmpty(assignedEmail)) {
            setAlertInfo({ message: "Cannot have anonymous purchased items", type: "warning" });
            return
        }

        axios.put(`${API}/items`, {
            id: focussedItem.id,
            list_id: focussedItem.list_id,
            assigned_user: { email: assignedEmail },
            is_purchased: isPurchased,
        }, {
            withCredentials: true
        })
            .then(() => {
                reset()
            })
            .catch(error => {
                console.log(error);
                if (error.response?.data?.includes("refresh")) {
                    setAlertInfo({ message: "User already assigned to this item.  Refreshing...", type: "error" });
                    setTimeout(() => navigate(0), 3000);
                }
            })
    }

    function deleteItem(itemId) {
        if (!itemId || !listId) { return }
        axios.delete(`${API}/items`, {
            data: {
                id: itemId,
                list_id: listId
            },
            withCredentials: true,
        })
            .then(() => {
                getItems();
            })
            .catch(error => {
                console.log(error);
            });
    }

    function buildItems(itemsList) {
        if (!itemsList || itemsList.length <= 0) {
            return <p key={"empty items"}>Empty</p>
        }

        const leadingActions = (listedItem) => (
            <LeadingActions>
                <SwipeAction onClick={() => handleEditSection(listedItem)}>
                    <div className="swipe-action-inner" style={{ backgroundColor: "var(--color-yellow)" }}><BiEditAlt />
                    </div>
                </SwipeAction>
            </LeadingActions>
        );

        const trailingActions = (listedItem) => (
            <TrailingActions>
                <SwipeAction
                    onClick={() => handleItemDelete(listedItem)}
                >
                    <div className="swipe-action-inner" style={{ backgroundColor: "var(--color-red)" }}><BiTrashAlt />
                    </div>
                </SwipeAction>
            </TrailingActions>
        );

        return (
            itemsList.map(listedItem => {
                let avatar_photo_name = listedItem.assigned_user?.photo;
                let avatar = avatar_photo_name ? `${API}/image?photo=${avatar_photo_name}&email=${listedItem.assigned_user?.email}` : null;

                const itemHTML = (
                    <div className='item' key={listedItem.id}>
                        {isSwipeable ?
                            buildSwipeItemContent(listedItem)
                            :
                            buildItemContent(listedItem, avatar)
                        }
                    </div>
                )

                if (isSwipeable) {
                    return (
                        <SwipeableListItem
                            className='more-bottom noselect'
                            key={`swipe-${listedItem.id}`}
                            leadingActions={leadingActions(listedItem)}
                            trailingActions={trailingActions(listedItem)}
                        >{itemHTML}
                        </SwipeableListItem>
                    )
                }

                return itemHTML;
            })
        )
    }

    function buildItemContent(listedItem, avatar) {
        return (<>
            {isMyList ?
                <div className="item-left">
                    <div onClick={() => handleItemDelete(listedItem)}><BiTrashAlt className="trash" /></div>
                    <div onClick={() => handleEditSection(listedItem)}><BiEditAlt className='edit' /></div>
                </div> :
                <div className="item-left noselect" onClick={() => handleEditSection(listedItem)}>
                    <div className="flex-1">
                        <div className="profile-container selectable">
                            <img src={avatar || NoProfile} alt={`${listedItem.assigned_user?.email}-profile-photo`} />
                        </div>
                        <small>{listedItem.assigned_user?.username}</small>
                    </div>
                    <div className="check flex-1">{listedItem.is_purchased ? <IoBagCheckOutline color='var(--color-green)' /> : null}</div>
                </div>
            }

            <div className={!isMyList && listedItem.is_purchased ? "item-center strikethrough" : "item-center"}>
                <p>{listedItem.item_name}</p>
                <small>{listedItem.item_description}</small>
            </div>
            <div className="item-right">
                <a target="_blank" href={listedItem.link} rel="noreferrer">{listedItem.link ? <BiLink color='var(--color-blue)' /> : null}</a>
            </div>
        </>
        )
    }

    function buildSwipeItemContent(listedItem) {
        return (<>
            <div className="item-left">
                <p>{listedItem.item_name}</p>
            </div>
            <div className="item-center">
                <small>{listedItem.item_description}</small>
            </div>
            <div className="item-right">
                <a target="_blank" href={listedItem.link} rel="noreferrer">{listedItem.link ? <BiLink color='var(--color-blue)' /> : null}</a>
            </div>
        </>
        )
    }

    function reset() {
        setNewItem(defaultItem)
        setFocussedItem()
        getItems()
    }

    function buildItemForm() {
        if (!["add", "edit"].includes(action) || !isMyList) {
            return
        }

        let isEdit = action === "edit"
        let callback = () => {
            isEdit ? editItemBasic() : addItem();
            setAction('view');
        }
        let cancelCallback = () => { setNewItem(defaultItem); setAction('view') }

        if (isEdit && isCompletelyEmpty(
            [newItem.title, newItem.description, newItem.link]
        )) {
            setNewItem({ title: focussedItem.item_name, description: focussedItem.item_description, link: focussedItem.link })
        }

        return <TextInputsModal
            headline={isEdit ? "Edit Item" : "New Item"}
            inputSections={[
                {
                    labelValue: 'Item Title',
                    inputType: 'text',
                    id: 'itemTitle',
                    value: newItem?.title,
                    placeholder: 'Piggy Bank',
                    onChange: (e) => handleFieldChange(e, 'title', setNewItem),
                    onKeyDown: (e) => onEnterPressed(e, callback),
                },
                {
                    labelValue: 'Item Description',
                    inputType: 'text',
                    id: 'itemDesc',
                    value: newItem?.description,
                    placeholder: 'Has to be small',
                    onChange: (e) => handleFieldChange(e, 'description', setNewItem),
                    onKeyDown: (e) => onEnterPressed(e, callback),
                },
                {
                    labelValue: 'Link',
                    inputType: 'text',
                    id: 'itemLink',
                    value: newItem?.link,
                    placeholder: 'https://...',
                    onChange: (e) => handleFieldChange(e, 'link', setNewItem),
                    onKeyDown: (e) => onEnterPressed(e, callback),
                },
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
                    onKeyDown: (e) => onEnterPressed(e, callback),
                },
            ]}
            onOverlayClick={cancelCallback}
        />
    }

    function buildAssignmentForm() {
        if (action !== "edit" || isMyList || user === null) {
            return
        }

        const assignedUser = focussedItem?.assigned_user?.email;
        if (assignedUser && assignedUser !== user.email) {
            setAlertInfo({ message: "Someone else is already handling this item", type: "warning" });
            setAction('view')
            return
        }

        let callback = () => { editItemAssignment(); setAction('view') }
        let cancelCallback = () => { setAction('view') }

        return <TextInputsModal
            headline={"Item Properties"}
            inputSections={[
                {
                    labelValue: 'Assign Self to Item',
                    inputType: 'checkbox',
                    id: 'self assign',
                    value: assignedUser,
                    placeholder: '',
                    onChange: (e) => {
                        e.target.useValue = true
                        e.target.value === user.email ? e.target.value = '' :
                            e.target.value = user.email;
                        handleFieldChange(e, 'assigned_user.email', setFocussedItem)
                    },
                    onKeyDown: (e) => onEnterPressed(e, callback),
                },
                {
                    labelValue: 'Item was Purchased',
                    inputType: 'checkbox',
                    id: 'self purchased',
                    value: focussedItem?.is_purchased,
                    placeholder: '',
                    onChange: (e) => {
                        console.log('checked is', e.target.checked);
                        handleFieldChange(e, 'is_purchased', setFocussedItem)
                    },
                    onKeyDown: (e) => onEnterPressed(e, callback),
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
                    onKeyDown: (e) => onEnterPressed(e, callback),
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
                {isMobileView() && <LogoHeader />}
                <div className="items-page">
                    <div className="lists" style={{ alignSelf: "center" }}>
                        <div className="item-list-title ellipse-overflow">
                            <h1><a onClick={() => { navigate(-1) }} className="back-arrow"><BiChevronLeft /></a>{location.state.listInfo?.title}</h1>
                        </div>
                        <div className="items-container card">
                            {isMyList &&
                                <div>
                                    <button style={{ marginTop: "10px" }} onClick={() => { setAction("add") }}>Add Item +</button>
                                </div>}
                            {isSwipeable ?
                                <SwipeableList fullSwipe={true}
                                    type={ListType.IOS} threshold={0.5}>
                                    {buildItems(items)}
                                </SwipeableList>
                                :
                                buildItems(items)
                            }
                        </div>
                        {isMyList ? buildItemForm() : buildAssignmentForm()}
                    </div>
                    {isMyList ? <Viewers listId={listId} /> : <Messages listId={listId} />}
                </div>
            </div>
        </ScreenSizeContext.Provider>
    )
}

export default Items