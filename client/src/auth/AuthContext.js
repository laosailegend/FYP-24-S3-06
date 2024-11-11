import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [tokenObj, setTokenObj] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
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
                    company: decodedToken.company || "", // Include company ID
                });
                setIsLoggedIn(true);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (error) {
                console.error("Error decoding token:", error);
                setIsLoggedIn(false);
                setTokenObj(null);
            }
        }

        const interval = setInterval(tokenExp, 60000);
        return () => clearInterval(interval);
    }, []);

    const login = async (token) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem("token", token);
        setIsLoggedIn(true);
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setTokenObj({
            fname: decodedToken.fname || "",
            lname: decodedToken.lname || "",
            email: decodedToken.email || "",
            role: decodedToken.role || "",
            id: decodedToken.id || "",
            company: decodedToken.company || "", // Include company ID
        });

        // Prepare payload (if needed for the backend)
        const payload = {
            email: decodedToken.email,
            password: decodedToken.password,
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER}login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
            throw new Error('Login failed: ', data.error);
            }

            console.log("Login successful:", data); // Handle response data here
        } catch (error) {
            console.error("Error during login:", error.message);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setTokenObj(null);
        delete axios.defaults.headers.common['Authorization'];
        window.location.reload();
    };

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
