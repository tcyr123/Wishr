import axios from 'axios';
import { useEffect, useState } from 'react';
import { BiBell, BiHomeAlt } from 'react-icons/bi';
import NoProfile from "../../assets/NoProfile.png";
import logo from "../../assets/wishrlogo.png";
import { API } from "../../constants";
import { useScreenSizeContext } from "../../contexts/ScreenSizeContext";
import { useUser } from '../../contexts/UseUser';
import "./Nav.css";

export default function Nav() {
    const screenSize = useScreenSizeContext();
    const { user, savePP } = useUser();
    const [profilePic, setProfilePic] = useState(user?.pp)


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

    return (
        <div className="nav">
            <div className="nav-logo"><img src={logo} alt='logo' /></div>
            <div className="nav-btn-container">
                <BiHomeAlt color='black' size={screenSize === "mobile" ? "2rem" : "2.5rem"} />
                <div className="nav-divider"></div>
                <div className="notification-icon">
                    <BiBell color='black' size={screenSize === "mobile" ? "2rem" : "2.5rem"} />
                    <div className="notification-badge">5</div>
                </div>
                <div className="nav-divider"></div>
                <div className="nav-profile" onClick={() => { alert(`You are ${user?.username}`) }}>
                    <div className="profile-container">
                        <img src={profilePic || NoProfile} alt="profile" />
                    </div>
                </div>
            </div>
        </div>
    )
}