import { createContext, useContext, useEffect, useRef, useState } from "react";
import "./Alert.css";

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const containerRef = useRef(null);

    useEffect(() => {
        // Scroll to the bottom whenever alerts change
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [alerts]);

    const showAlert = (message, type) => {
        const id = Date.now();
        setAlerts((prevAlerts) => [...prevAlerts, { id, message, type }]);

        // removes alert
        setTimeout(() => {
            setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
        }, 3000); // 3 seconds duration
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <div className="alert-container" ref={containerRef}>
                {alerts.map((alert) => (
                    <div key={alert.id} className={`alert ${alert.type}`}>
                        {alert.message}
                    </div>
                ))}
            </div>
        </AlertContext.Provider>
    );
};
