import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../../assets/wishrlogo.png";

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const navigate = useNavigate();

    const handleRegister = () => {
        console.log('Registration clicked with username:', username, 'and password:', password);
    };

    return (
        <div className="login">
            <img src={logo} alt="logo" className="logo" />
            <div className="card login-box">
                <h2>Register</h2>
                <form>
                    <div className='input-box'>
                        <label htmlFor="newUsername">Username:</label>
                        <input
                            type="text"
                            id="newUsername"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className='input-box'>
                        <label htmlFor="newPassword">Password:</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className='input-box'>
                        <label htmlFor="newPasswordConf">Confirm Password:</label>
                        <input
                            type="password"
                            id="newPasswordConf"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                    </div>
                    <button type="button" onClick={handleRegister}>
                        Register
                    </button>
                    <p>
                        Already have an account?{' '}
                        <a className="btn-link" onClick={() => { navigate('/login') }}>
                            Login
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}