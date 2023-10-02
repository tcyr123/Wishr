import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { BiBell, BiHomeAlt } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import NoProfile from "../../assets/NoProfile.png";
import logo from "../../assets/wishrlogo.png";
import { API } from "../../constants";
import { useScreenSizeContext } from "../../contexts/ScreenSizeContext";
import { useUser } from '../../contexts/UseUser';
import "./Nav.css";

export default function Nav() {
    const screenSize = useScreenSizeContext();
    const { user, savePP, logout } = useUser();
    const [profilePic, setProfilePic] = useState(user?.pp)
    const [showNavBox, setShowNavBox] = useState(0)
    const navigate = useNavigate();
    const navBoxRef = useRef(null);
    const [notifications, setNotifications] = useState([
        { id: 1, text: "Welcome! This is your notifications panel." },
        { id: 2, text: "TCyr shared a list with you\n\"Taylor's Christmas List 2023\"" },
        { id: 3, text: "Tcyr added a new item to the list\n\"Nike Lunar 3.0 Cleats\"" }
    ])

    useEffect(() => {
        console.log('user is', user);
        if (!profilePic && user && user.photo) {
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
    }, [user, profilePic]);

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

    const toggleNotifications = () => {
        setShowNavBox(current => current === 1 ? 0 : 1)
    }

    const toggleProfile = () => {
        setShowNavBox(current => current === 2 ? 0 : 2)
    }

    function buildNotifications() {
        return (
            <div class="notification-box-container" ref={navBoxRef}>
                <div class="arrow arrow-notif"></div>
                <div class="notification-box noti-messages">
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
        return (
            <div class="notification-box-container" ref={navBoxRef}>
                <div class="arrow arrow-prof"></div>
                <div class="notification-box">
                    <h2>Profile</h2>
                    <div style={{ padding: "5px" }}>
                        <p key={user?.email}>{user?.username} - {user?.email}</p>
                        <button onClick={logout}>Logout</button>
                    </div>
                </div></div>
        )
    }

    return (
        <div className="nav">
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
    )
}