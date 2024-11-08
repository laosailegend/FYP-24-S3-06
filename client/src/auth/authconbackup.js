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
            } catch (error) {
                console.error("Error decoding token:", error);
                setIsLoggedIn(false);
                setTokenObj(null);
            }
        }
    }, []);

    const login = (token) => {
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
    };

    const logout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setTokenObj(null);  // Clear tokenObj on logout
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
                window.alert("Token has expired. Logging out...")
                logout();
            }
        }
    }
    // console.log(tokenObj);
    return (
        <AuthContext.Provider value={{ isLoggedIn, tokenObj, login, logout, tokenExp }}>
            {children}
        </AuthContext.Provider>
    );
};
