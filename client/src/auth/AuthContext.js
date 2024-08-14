// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

// Create the AuthContext
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [tokenObj, setTokenObj] = useState({
        fname: "",
        lname: "",
        email: "",
        role: "",
        id: ""
    });

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            try {
                // Decode the token to get user data
                const decodedToken = JSON.parse(atob(token.split('.')[1]));

                // Set the tokenObj state with decoded token values
                setTokenObj({
                    fname: decodedToken.fname || "",
                    lname: decodedToken.lname || "",
                    email: decodedToken.email || "",
                    role: decodedToken.role || "",
                    id: decodedToken.id || "",
                });

                // Set isLoggedIn to true since the token exists and was decoded successfully
                setIsLoggedIn(true);
            } catch (error) {
                console.error("Error decoding token:", error);
                // Handle token parsing error or invalid token format
            }
        }
    }, []);

    const login = (token) => {
        localStorage.setItem("token", token);

        try {
            // Decode the token to get user data
            const decodedToken = JSON.parse(atob(token.split('.')[1]));

            // Set the tokenObj state with decoded token values
            setTokenObj({
                fname: decodedToken.fname || "",
                lname: decodedToken.lname || "",
                email: decodedToken.email || "",
                role: decodedToken.role || "",
                id: decodedToken.id || "",
            });

            // Set isLoggedIn to true since login was successful
            setIsLoggedIn(true);
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setTokenObj({
            fname: "",
            lname: "",
            email: "",
            role: "",
            id: ""
        });
        window.location.reload();
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, tokenObj, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

