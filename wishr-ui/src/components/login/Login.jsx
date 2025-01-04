import axios from "axios";
import { useEffect, useState } from "react";
import { BiHide, BiShow } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo_svg_crop2.svg";
import { API, onEnterPressed, preventDefault } from "../../constants";
import { useAlert } from "../../contexts/Alert";
import { useUser } from "../../contexts/UseUser";
import ForgotPW from "./ForgotPW";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pwType, setPwType] = useState("password");
    const [loading, setLoading] = useState(false);
    const [showForgotPW, setShowForgotPW] = useState(false);
    const { showAlert } = useAlert();
    const [alertInfo, setAlertInfo] = useState(null);
    const { login } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (alertInfo) {
            showAlert(alertInfo.message, alertInfo.type);
            setAlertInfo(null); // Reset alert state to avoid repeated calls
        }
    }, [alertInfo, showAlert]);

    const handleLogin = () => {
        if (!email || !password) {
            setAlertInfo({ message: 'Please provide both email and password.', type: "warning" });
            return;
        }
        setLoading(true);

        axios.post(`${API}/login`, {
            email,
            password
        }, { withCredentials: true })
            .then(response => {
                login(response.data);
                navigate('/')
            })
            .catch(error => {
                console.log(error);
                setAlertInfo({ message: 'Incorrect email or password.', type: "error" });
            }).finally(() => {
                setLoading(false);
            });
    };

    const togglePwType = () => {
        if (pwType !== "password") {
            setPwType("password")
        } else {
            setPwType("text")
        }
    }

    function choosePWIcon() {
        return (
            <button onClick={togglePwType}>
                {pwType === "password" ? <BiShow /> : <BiHide />}
            </button >
        )
    }

    return (
        <div className="login">
            <img src={logo} alt="logo" className="logo" />
            <div style={{ width: "70%", maxWidth: "350px" }}>
                <form onSubmit={preventDefault}>
                    <div className="input-box">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onKeyDown={(e) => onEnterPressed(e, handleLogin)}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="input-box">
                        <label htmlFor="password">Password:</label>
                        <div className="input-with-button">
                            <input
                                className="right-pad"
                                type={pwType}
                                id="password"
                                value={password}
                                onKeyDown={(e) => onEnterPressed(e, handleLogin)}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {choosePWIcon()}
                        </div>
                    </div>
                    <button type="button" onClick={handleLogin} disabled={loading}>Login</button>
                    <div className="extras">
                        <p>
                            <a className="btn-link" onClick={() => setShowForgotPW(true)}>
                                Forgot Password
                            </a>
                        </p>
                        <p>
                            Don&apos;t have an account? &nbsp;
                            <a className="btn-link" onClick={() => { navigate('/register') }}>
                                Register
                            </a>
                        </p>
                    </div>
                </form>
            </div>
            <ForgotPW doBegin={showForgotPW} onBeginChange={(beginVal) => { setShowForgotPW(beginVal) }} />
        </div>
    )
}

export default Login