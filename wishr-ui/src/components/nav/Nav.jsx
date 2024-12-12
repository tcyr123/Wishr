import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { BiBell, BiHomeAlt } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import NoProfile from "../../assets/NoProfile.png";
import logo from "../../assets/wishrlogo.png";
import { API } from "../../constants";
import { useUser } from '../../contexts/UseUser';
import "./Nav.css";

function Nav({ children }) {
    const { user, savePP, logout } = useUser();
    const [profilePic, setProfilePic] = useState(user?.pp)
    const [showNavBox, setShowNavBox] = useState(0)
    const navigate = useNavigate();
    const previousUser = useRef();
    const navBoxRef = useRef();
    const [notifications, setNotifications] = useState([
        { id: 1, text: "Welcome! This is your notifications panel." },
        { id: 2, text: "TCyr shared a list with you\n\"Taylor's Christmas List 2023\"" },
        { id: 3, text: "Tcyr added a new item to the list\n\"Nike Lunar 3.0 Cleats\"" }
    ])

    useEffect(() => {
        console.log('nav is loaded');

        return () => {
            console.log('nav is unloaded');
        }
    }, [])

    useEffect(() => {
        console.log('user is', user);

        if (!profilePic && user && user.photo) {
            //no need to re-run this when users local photo changes
            if (user.pp && previousUser.current?.pp === user.pp) {
                console.log('users local pp was same. Not calling remote pp');
                return
            }

            axios.get(`${API}/image`, {
                params: {
                    photo: user.photo
                },
                responseType: 'blob' //very important line
            })
                .then(response => {
                    const picture = URL.createObjectURL(response.data)
                    savePP(picture)
                    setProfilePic(picture);
                })
                .catch(error => {
                    console.log(error);
                });
        }
        previousUser.current = user;
    }, [user]);

    useEffect(() => {
        let clickTimeout;
        if (showNavBox) {
            clickTimeout = setTimeout(() => {
                document.addEventListener('click', handleDocumentClick);
            }, 0);
        }

        return () => {
            clearTimeout(clickTimeout);
            document.removeEventListener('click', handleDocumentClick);
        }
    }, [showNavBox]);

    const handleDocumentClick = (e) => {
        if (navBoxRef.current && !navBoxRef.current.contains(e.target)) {
            setShowNavBox(0);
        }
    };

    const handleAvatarChange = (e) => {
        if (!e.target?.files[0]) { return }
        uploadAvatar(e.target.files[0]);
    }

    const toggleNotifications = () => {
        setShowNavBox(current => current === 1 ? 0 : 1)
    }

    const toggleProfile = () => {
        setShowNavBox(current => current === 2 ? 0 : 2)
    }

    function uploadAvatar(file) {
        const formData = new FormData();
        formData.append('photo', file);

        axios.post(`${API}/image`, formData, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then((response) => {
                if (response.status === 200) {
                    const picture = URL.createObjectURL(file)
                    savePP(picture)
                    setProfilePic(picture);
                }
            })
            .catch(error => {
                console.log(error);
            });
    }

    function buildNotifications() {
        return (
            <div className="notification-box-container translated-center" ref={navBoxRef}>
                <div className="arrow arrow-notif"></div>
                <div className="notification-box noti-messages">
                    <h2>Notifications</h2>
                    <ul>
                        {notifications.map(notification => (
                            <li key={notification.id}>{notification.text}</li>
                        ))}
                    </ul>
                </div></div>
        )
    }

    function buildProfile() {
        const lowPad = { padding: "4px" }
        const inverseBtn = {
            backgroundColor: 'white',
            border: 'solid 1px #4080c6',
            color: '#4080c6',
            flex: "1",
        }

        return (
            <div className="notification-box-container translated-center" ref={navBoxRef}>
                <div className="arrow arrow-prof"></div>
                <div className="notification-box">
                    <h2>Profile</h2>
                    <p key={user?.email}>{user?.username} - {user?.email}</p>
                    <div style={lowPad} className='btn-box'>
                        <label htmlFor="avatar_upload" className='button' style={{ ...inverseBtn, ...lowPad }} >
                            Modify Avatar
                        </label>
                        <input
                            type="file"
                            id="avatar_upload"
                            name="avatar_upload"
                            accept=".jpg, .jpeg, .png"
                            style={{ display: "none" }}
                            onChange={handleAvatarChange}
                        />
                        <button style={lowPad} onClick={logout}>Logout</button>
                    </div>
                </div></div>
        )
    }

    return (<>
        <div className="nav" key={"nav"}>
            <div className="nav-logo" onClick={() => { navigate("/") }}><img src={logo} alt='logo' /></div>
            <div className="nav-btn-container">
                <BiHomeAlt onClick={() => { navigate("/") }} color='black' />
                <div className="nav-divider"></div>
                <div className="notification-icon" onClick={toggleNotifications}>
                    <BiBell color='black' />
                    <div className="notification-badge noselect">5</div>
                </div>

                <div className="nav-divider"></div>
                <div className="nav-profile" onClick={toggleProfile}>
                    <div className="profile-container">
                        <img src={profilePic || NoProfile} alt="profile" />
                    </div>
                </div>
                {showNavBox === 1 ? buildNotifications() : showNavBox === 2 ? buildProfile() : null}
            </div>
        </div>
        {children}
    </>
    )
}

export default Nav