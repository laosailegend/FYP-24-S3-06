import React from "react";

const Home = () => {
    return (
        <>
            <div className="home-banner">
                <h1>EmpRoster</h1>
            </div>

            <div className="main-content">
                <button className="login">Login</button>
                <button className="logout">Logout</button>
                <button className="admin-create-users">Create new users admin</button>
            </div>
        
        </>
    )
}

export default Home;