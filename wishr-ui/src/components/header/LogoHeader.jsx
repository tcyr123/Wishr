import { useNavigate } from "react-router-dom";
import logoimg from "../../assets/logo_svg_crop2.svg";

function LogoHeader() {
    const navigate = useNavigate();
    const goHomeHandler = () => { navigate("/") }

    return (
        <div className="mobile-logo" onClick={goHomeHandler}><img src={logoimg} alt='logo' /></div>
    )
}

export default LogoHeader