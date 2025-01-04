import axios from 'axios';
import { useEffect, useState } from 'react';
import { BiHide, BiShow } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import logo from "../../assets/logo_svg_crop2.svg";
import { API, containsEmptyString, emailPattern, isValidPw, onEnterPressed, preventDefault } from '../../constants';
import { useAlert } from '../../contexts/Alert';
import { useUser } from '../../contexts/UseUser';

function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [secQuestion, setSecQuestion] = useState(-1);
    const [secAnswer, setSecAnswer] = useState('');
    const [pwType, setPwType] = useState("password");
    const [loading, setLoading] = useState(false);
    const [securityQuestions, setSecurityQuestions] = useState([]);
    const { showAlert } = useAlert();
    const [alertInfo, setAlertInfo] = useState(null);
    const { login } = useUser();
    const navigate = useNavigate();

    const handleRegister = () => {
        if (containsEmptyString([email, username, password, passwordConfirm, secAnswer]) || !secQuestion || secQuestion <= 0) {
            setAlertInfo({ message: 'All fields must have a value', type: "warning" });
            return
        }

        if (!emailPattern.test(email)) {
            setAlertInfo({ message: 'Invalid email format', type: "warning" });
            return;
        }

        if (!isValidPw(password)) {
            setAlertInfo({ message: 'Password must be at least 8 characters long and include a number and a special character', type: "warning" });
            return;
        }

        if (passwordConfirm !== password) {
            setAlertInfo({ message: 'Passwords do not match', type: "warning" });
            return
        }

        let secQuestionId = secQuestion
        try {
            secQuestionId = parseInt(secQuestion)
        } catch (error) {
            const SEC_Q_ERR = 'error with security question'
            console.log(SEC_Q_ERR, error);
            setAlertInfo({ message: `${SEC_Q_ERR}. Try again later`, type: "error" });
            return
        }

        setLoading(true);

        axios.post(`${API}/register`, {
            email,
            password,
            username,
            security_question_id: secQuestionId,
            security_answer: secAnswer
        }, { withCredentials: true })
            .then(response => {
                login(response.data)
                navigate('/')
            })
            .catch(error => {
                console.log(error);
                setAlertInfo({ message: "Server Error. Try again later", type: "error" });
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

    useEffect(() => {
        axios.get(`${API}/security-questions`, { withCredentials: false })
            .then(response => {
                let selOne = [{ id: -1, question: "Select One" }]
                setSecurityQuestions([...selOne, ...response.data]);
            })
            .catch(error => {
                console.log(error);
                setAlertInfo({ message: "Failed to load security questions. Try again later.", type: "error" });
            });
    }, []);

    useEffect(() => {
        if (alertInfo) {
            showAlert(alertInfo.message, alertInfo.type);
            setAlertInfo(null); // Reset alert state to avoid repeated calls
        }
    }, [alertInfo, showAlert]);

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
                        <div className='input-with-button'>
                            <input
                                type={pwType}
                                id="newPassword"
                                value={password}
                                onKeyDown={(e) => onEnterPressed(e, handleRegister)}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {choosePWIcon()}
                        </div>
                    </div>
                    <div className='input-box'>
                        <label htmlFor="newPasswordConf">Confirm Password:</label>
                        <div className="input-with-button">
                            <input
                                type={pwType}
                                id="newPasswordConf"
                                value={passwordConfirm}
                                onKeyDown={(e) => onEnterPressed(e, handleRegister)}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                            />
                            {choosePWIcon()}
                        </div>
                    </div>
                    <div className='input-box'>
                        <label htmlFor="secQuestion">Security Question:</label>
                        <select
                            id="secQuestion"
                            name='secQuestion'
                            value={secQuestion}
                            onKeyDown={(e) => onEnterPressed(e, handleRegister)}
                            onChange={(e) => setSecQuestion(e.target.value)}
                        >
                            {securityQuestions.length > 0 ? (
                                securityQuestions.map(option => (
                                    <option key={`secoption-${option.id}`} value={option.id}>
                                        {option.question}
                                    </option>
                                ))
                            ) : (
                                <option disabled>Loading questions...</option>
                            )}
                        </select>
                    </div>
                    <div className='input-box'>
                        <label htmlFor="secAnswer">Security Answer:</label>
                        <input
                            type="text"
                            id="secAnswer"
                            value={secAnswer}
                            onKeyDown={(e) => onEnterPressed(e, handleRegister)}
                            onChange={(e) => setSecAnswer(e.target.value)}
                        />
                    </div>
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