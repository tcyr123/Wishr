import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../../assets/logo_svg_crop2.svg";
import { API, containsEmptyString, emailPattern, onEnterPressed, preventDefault } from '../../constants';
import { useUser } from '../../contexts/UseUser';

function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useUser();
    const navigate = useNavigate();

    const handleRegister = () => {
        if (containsEmptyString([email, username, password, passwordConfirm])) {
            setError("All fields must have a value")
            return
        }

        if (!emailPattern.test(email)) {
            setError("Invalid email format");
            return;
        }

        if (password.length < 8 || !/[!@#$%^&*]/.test(password) || !/\d/.test(password)) {
            setError("Password must be at least 8 characters long and include a number and a special character");
            return;
        }

        if (passwordConfirm !== password) {
            setError("Passwords do not match")
            return
        }

        setLoading(true);

        axios.post(`${API}/register`, {
            email,
            password,
            username
        }, { withCredentials: true })
            .then(response => {
                login(response.data)
                navigate('/')
            })
            .catch(error => {
                console.log(error);
                setError('Server Error. Try again later.')
            }).finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="login">
            <img src={logo} alt="logo" className="logo" />
            <div>
                <form onSubmit={preventDefault}>
                    <div className='input-box'>
                        <label htmlFor="newEmail">Email:</label>
                        <input
                            type="email"
                            id="newEmail"
                            value={email}
                            onKeyDown={(e) => onEnterPressed(e, handleRegister)}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className='input-box'>
                        <label htmlFor="newUsername">Username:</label>
                        <input
                            type="text"
                            id="newUsername"
                            value={username}
                            onKeyDown={(e) => onEnterPressed(e, handleRegister)}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className='input-box'>
                        <label htmlFor="newPassword">Password:</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={password}
                            onKeyDown={(e) => onEnterPressed(e, handleRegister)}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className='input-box'>
                        <label htmlFor="newPasswordConf">Confirm Password:</label>
                        <input
                            type="password"
                            id="newPasswordConf"
                            value={passwordConfirm}
                            onKeyDown={(e) => onEnterPressed(e, handleRegister)}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="button" onClick={handleRegister} disabled={loading}>
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

export default Register