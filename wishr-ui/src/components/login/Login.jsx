import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/wishrlogo.png";
import { API } from "../../constants";
import { useUser } from "../../contexts/UseUser";
import "./Login.css";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useUser();
    const navigate = useNavigate();

    const handleLogin = () => {
        if (!username || !password) {
            setError('Please provide both username and password.');
            return;
        }
        setLoading(true);

        axios.post(`${API}/login`, {
            email: username,
            password: password
        }, { withCredentials: true })
            .then(response => {
                login(response.data);
                //todo: set an axios request to call "refresh"
                navigate('/')
            })
            .catch(error => {
                console.log(error);
            }).finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="login">
            <img src={logo} alt="logo" className="logo" />
            <div className="card login-box">
                <h2>Login</h2>
                <form>
                    <div className="input-box">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="input-box">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="button" onClick={handleLogin} disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    <p>
                        Don't have an account?{' '}
                        <a className="btn-link" onClick={() => { navigate('/register') }}>
                            Register
                        </a>
                    </p>
                </form>
            </div>
        </div>
    )
}