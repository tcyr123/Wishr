import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/wishrlogo.png";
import "./Login.css";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        console.log('Login clicked with username:', username, 'and password:', password);
    };

    return (
        <div className="login">
            <img src={logo} alt="logo" className="logo" />
            <div className="login-box">
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
                    <button type="button" onClick={handleLogin}>
                        Login
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