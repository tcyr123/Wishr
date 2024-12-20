import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo_svg_crop2.svg";
import { API, onEnterPressed, preventDefault } from "../../constants";
import { useUser } from "../../contexts/UseUser";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useUser();
    const navigate = useNavigate();

    const handleLogin = () => {
        if (!email || !password) {
            setError('Please provide both email and password.');
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
                setError('Incorrect email or password.')
            }).finally(() => {
                setLoading(false);
            });
    };

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
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onKeyDown={(e) => onEnterPressed(e, handleLogin)}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="button" onClick={handleLogin} disabled={loading}>Login</button>
                    <p>
                        {"Don't have an account?"} {' '}
                        <a className="btn-link" onClick={() => { navigate('/register') }}>
                            Register
                        </a>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Login