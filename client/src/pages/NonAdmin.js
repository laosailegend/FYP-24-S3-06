import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

// test page to prevent the admin from accessing the page

const NonAdmin = () => {
    const { tokenObj } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (tokenObj.role !== 1) {
            window.alert("You are not authorized to view this page");
            navigate("/"); // Redirect only once after the first render
        }
    }, [tokenObj, navigate]);

    return (
        <>
            <h1>I know where you live</h1>
        </>
    )
}

export default NonAdmin;