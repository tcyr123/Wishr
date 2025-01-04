import axios from "axios";
import Cookies from "js-cookie";
import { createContext, useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { API } from "../constants";

const UserContext = createContext();
const TOKEN_REFRESH_SECONDS = 840000 //14minutes. Expires at 15.

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    // const navigate = useNavigate();
    let tokenRefreshInterval;

    // Check local storage for user data during initialization
    //helps if a user refreshed and we lost context/provider states
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            console.log('user was changed during inital load (from local storage)');
            setUser(JSON.parse(storedUser));
            refreshToken(); // Catches the case of a user refresh since we don't re-call the login function that starts the timer loop
        }

    }, []);

    const login = (userData) => {
        //will refresh token at right time
        startTokenRefreshInterval()
        console.log('user was changed during login');
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const savePP = (pp) => {
        console.log('user was changed during savePP');
        setUser({ ...user, pp: pp });
        localStorage.setItem('user', JSON.stringify({ ...user, pp: pp }));
    };

    const startTokenRefreshInterval = () => {
        //Essentially the same as setTimeout but more accurate
        clearInterval(tokenRefreshInterval);

        tokenRefreshInterval = setInterval(() => {
            refreshToken();
        }, TOKEN_REFRESH_SECONDS);
    };

    const refreshToken = () => {
        const token = Cookies.get("session_token");
        if (!token) {
            return;
        }

        axios.get(`${API}/refresh`, {
            withCredentials: true,
        })
            .then((response) => {
                if (response.status === 200) {
                    startTokenRefreshInterval();
                } else {
                    wipeout()
                }
            })
            .catch((error) => {
                console.log(error);
                wipeout()
            });
    };

    const logout = () => {
        axios.get(`${API}/logout`, {
            withCredentials: true,
        })
            .then(() => {

            })
            .catch(error => {
                console.log(error);
            })
            .finally(() => {
                wipeout()
            })
    };

    const wipeout = () => {
        console.log('user was changed during wipeout');
        setUser(null);
        localStorage.removeItem('user');
        Cookies.remove('session_token');
        window.location.reload();
    }

    return (
        <UserContext.Provider value={{ user, savePP, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

// hook
export function useUser() {
    return useContext(UserContext);
}
