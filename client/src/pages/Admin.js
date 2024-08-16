import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

const Admin = () => {
    const { tokenObj } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Wait until tokenObj is set before performing checks
        if (tokenObj === null) {
            return; // Don't do anything if tokenObj is still null
        }

        // Perform the authorization check once tokenObj is available
        if (!tokenObj || tokenObj.role !== 1) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
        }
    }, [tokenObj, navigate]);

    // If tokenObj is still null, don't render the content yet
    if (tokenObj === null) {
        return null;  // You can replace this with a loading indicator if you prefer
        
    }

    // Render the admin content if authorized
    return (
        <>
            <h1>Admin Content</h1>
        </>
    );
};


export default Admin;
