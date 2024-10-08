import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TimeOff = () => {
    const [requests, setRequests] = useState([]);

    const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
    const navigate = useNavigate();

    useEffect(() => {
        // prevents non-admin users from viewing the page
        if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 4)) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
            return () => { };
        }

        const fetchRequests = async () => {
            try {
                const response = await axios.get('http://localhost:8800/timeoff');
                setRequests(response.data);
            } catch (error) {
                console.error('Error fetching requests:', error);
            }
        };

        fetchRequests();
    }, [navigate, tokenObj]);

    const handleStatusChange = async (request_Id, newStatus) => {
        try {
            await axios.put(`http://localhost:8800/timeoff/${request_Id}`, { status: newStatus });
            // Remove the updated request from the list if it's no longer pending
            setRequests(requests.filter(request =>
                request.request_id !== request_Id || newStatus === 'pending'
            ));
        } catch (error) {
            console.error('Error updating request status:', error);
        }
    };

    return (
        <div>
            <h2>Time-Off Requests</h2>
            <table>
                <thead>
                    <tr>
                        <th>Request ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Request Date</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map(request => (
                        <tr key={request.request_id}>
                            <td>{request.request_id}</td>
                            <td>{request.fname}</td>
                            <td>{request.lname}</td>
                            <td>{new Date(request.request_date).toLocaleDateString()}</td>
                            <td>{new Date(request.start_date).toLocaleDateString()}</td>
                            <td>{new Date(request.end_date).toLocaleDateString()}</td>
                            <td>{request.reason}</td>
                            <td>{request.status}</td>
                            <td>
                                {request.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleStatusChange(request.request_id, 'approved')}>Approve</button>
                                        <button onClick={() => handleStatusChange(request.request_id, 'rejected')}>Reject</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimeOff;
