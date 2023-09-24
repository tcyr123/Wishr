import { BiBell, BiHomeAlt } from 'react-icons/bi';
import NoProfile from "../../assets/NoProfile.png";
import logo from "../../assets/wishrlogo.png";
import { useScreenSizeContext } from "../../contexts/ScreenSizeContext";
import "./Nav.css";


export default function Header({ profileInfo, profilePic }) {
    const screenSize = useScreenSizeContext();

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
                <div className="nav-profile" onClick={() => { alert(`You are ${profileInfo.username}`) }}>
                    <div className="profile-container">
                        <img src={profilePic || NoProfile} alt="profile" />
                    </div>
                </div>
            </div>
        </div>
    )
}