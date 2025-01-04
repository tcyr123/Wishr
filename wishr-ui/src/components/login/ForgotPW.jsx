import axios from "axios";
import { useEffect, useState } from "react";
import { API, isValidPw, onEnterPressed } from "../../constants";
import { useAlert } from "../../contexts/Alert";
import TextInputsModal from "../modals/TextInputsModal";

const GENERIC_ERR = { message: "Reset password credentials were incorrect", type: "error" }
const DEFAULT_STR = ''

function ForgotPW({ doBegin, onBeginChange }) {
    const [showResetPw1, setShowResetPw1] = useState(doBegin || false);
    const [showResetPw2, setShowResetPw2] = useState(false);
    const [email, setEmail] = useState(DEFAULT_STR);
    const [question, setQuestion] = useState(DEFAULT_STR);
    const [answer, setAnswer] = useState(DEFAULT_STR);
    const [pass, setPass] = useState(DEFAULT_STR);
    const { showAlert } = useAlert();
    const [alertInfo, setAlertInfo] = useState(null);

    useEffect(() => {
        setShowResetPw1(doBegin)
    }, [doBegin])

    useEffect(() => {
        if (alertInfo) {
            showAlert(alertInfo.message, alertInfo.type);
            setAlertInfo(null); // Reset alert state to avoid repeated calls
        }
    }, [alertInfo, showAlert]);

    const cancelCallback = () => {
        setShowResetPw1(false);
        onBeginChange(false);
        setShowResetPw2(false);
        setEmail(DEFAULT_STR)
        setQuestion(DEFAULT_STR)
        setAnswer(DEFAULT_STR)
        setPass(DEFAULT_STR)
    }

    const securityPrompt = () => {
        axios.get(`${API}/reset-password`, {
            params: {
                email
            }, withCredentials: false
        })
            .then(response => {
                if (!response.data?.question) { return }
                setQuestion(response.data?.question);

                //move on to stage 2
                setShowResetPw1(false)
                onBeginChange(false)
                setShowResetPw2(true)
            })
            .catch(error => {
                console.log(error);
                setAlertInfo(GENERIC_ERR);
                cancelCallback()
            })
    }

    const resetPW = () => {
        if (!isValidPw(pass)) {
            setAlertInfo({ message: "Password must be at least 8 characters long and include a number and a special character", type: "warning" });
            return
        }

        axios.post(`${API}/reset-password`, {
            security_answer: { email, answer },
            password: pass
        }, { withCredentials: false })
            .then((response) => {
                if (response.status === 202) {
                    setAlertInfo({ message: "Successfully Reset Password!", type: "success" });
                } else {
                    setAlertInfo(GENERIC_ERR);
                }
            })
            .catch(error => {
                console.log(error);
                setAlertInfo(GENERIC_ERR);
            })
            .finally(cancelCallback);
    }

    function buildResetForm1() {
        if (!showResetPw1) {
            return
        }

        return <TextInputsModal
            headline={"Reset Password Step 1"}
            inputSections={[
                {
                    labelValue: 'Email',
                    inputType: 'text',
                    id: 'itemTitle',
                    value: email,
                    placeholder: '',
                    onChange: (e) => setEmail(e.target.value),
                    onKeyDown: (e) => onEnterPressed(e, securityPrompt),
                }
            ]}
            buttons={[
                {
                    title: 'Cancel',
                    className: 'inverse-btn',
                    callbackFunction: cancelCallback,
                },
                {
                    title: 'Next Step',
                    className: '',
                    callbackFunction: securityPrompt,
                    onKeyDown: (e) => onEnterPressed(e, securityPrompt),
                },
            ]}
            onOverlayClick={cancelCallback}
        />
    }

    function buildResetForm2() {
        if (!showResetPw2) {
            return
        }

        return <TextInputsModal
            headline={"Reset Password Step 2"}
            inputSections={[{
                labelValue: question,
                inputType: 'text',
                id: 'secA',
                value: answer,
                onChange: (e) => setAnswer(e.target.value),
                onKeyDown: (e) => onEnterPressed(e, resetPW),
            }, {
                labelValue: 'New Password',
                inputType: 'text',
                id: 'itemLink',
                value: pass,
                onChange: (e) => setPass(e.target.value),
                onKeyDown: (e) => onEnterPressed(e, resetPW),
            }
            ]}
            buttons={[
                {
                    title: 'Cancel',
                    className: 'inverse-btn',
                    callbackFunction: cancelCallback,
                },
                {
                    title: 'Confirm',
                    className: '',
                    callbackFunction: resetPW,
                    onKeyDown: (e) => onEnterPressed(e, resetPW),
                },
            ]}
            onOverlayClick={cancelCallback}
        />
    }

    return (<>
        {buildResetForm1()}
        {buildResetForm2()}
    </>
    )
}

export default ForgotPW