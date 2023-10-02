import axios from "axios";
import Cookies from "js-cookie";
import { createContext, useContext, useEffect, useState } from "react";
import { API } from "../constants";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    let tokenRefreshInterval;

    // Check local storage for user data during initialization
    //helps if a user refreshed and we lost context/provider states
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            refreshToken() // Catches the case of a user refresh since we don't re-call the login function that starts the timer loop
        }
    }, []);

    const login = (userData) => {
        //will refresh token at right time
        startTokenRefreshInterval()
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const savePP = (pp) => {
        setUser({ ...user, pp: pp });
        localStorage.setItem('user', JSON.stringify({ ...user, pp: pp }));
    };

    const startTokenRefreshInterval = () => {
        //Essentially the same as setTimeout but more accurate
        clearInterval(tokenRefreshInterval);

        //In 1min 45sec call for refreshed token. Expires at 2min
        tokenRefreshInterval = setInterval(() => {
            refreshToken();
        }, 105000);
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
            .then(response => {

            })
            .catch(error => {
                console.log(error);
            })
            .finally(() => {
                wipeout()
            })
    };

    const wipeout = () => {
        setUser(null);
        localStorage.removeItem('user');
        window.location.href = '/login';
        Cookies.remove('session_token');
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
