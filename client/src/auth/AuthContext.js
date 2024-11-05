import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [tokenObj, setTokenObj] = useState(null);  // Initialize tokenObj state

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            // No token found, user is not logged in
            setIsLoggedIn(false);
            setTokenObj(null);
        } else {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                setTokenObj({
                    fname: decodedToken.fname || "",
                    lname: decodedToken.lname || "",
                    email: decodedToken.email || "",
                    role: decodedToken.role || "",
                    id: decodedToken.id || "",
                });
                setIsLoggedIn(true);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (error) {
                console.error("Error decoding token:", error);
                setIsLoggedIn(false);
                setTokenObj(null);
            }
        }

        // Set up interval to check token expiration
        const interval = setInterval(tokenExp, 60000); // Check every minute
        return () => clearInterval(interval); // Clean up interval on unmount
    }, []);

    const login = (token) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem("token", token);
        setIsLoggedIn(true);
        // Re-decode token and set tokenObj upon login
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setTokenObj({
            fname: decodedToken.fname || "",
            lname: decodedToken.lname || "",
            email: decodedToken.email || "",
            role: decodedToken.role || "",
            id: decodedToken.id || "",
        });
        console.log("auth header set");
    };

    const logout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setTokenObj(null);  // Clear tokenObj on logout
        delete axios.defaults.headers.common['Authorization'];
        window.location.reload();
    };

    // check if token exists, then check if token is expired, if expired, logout
    const tokenExp = () => {
        const token = localStorage.getItem("token");
        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const now = new Date();
            const exp = new Date(decodedToken.exp * 1000);
            if (now > exp) {
                window.alert("Token has expired. Logging out...");
                logout();
            }
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, tokenObj, login, logout, tokenExp }}>
            {children}
        </AuthContext.Provider>
    );
};