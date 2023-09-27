import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);

    // Check local storage for user data during initialization
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const savePP = (pp) => {
        setUser({ ...user, pp: pp });
        localStorage.setItem('user', JSON.stringify({ ...user, pp: pp }));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

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
