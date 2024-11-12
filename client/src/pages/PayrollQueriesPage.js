import React, { useEffect, useState } from 'react';
import '../style.css';

const server = process.env.REACT_APP_SERVER;

const PayrollQueriesPage = () => {
    const [queries, setQueries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState('In Progress');
    const [filterStatus, setFilterStatus] = useState('all');

    // Fetch all payroll queries
    useEffect(() => {
        const fetchQueries = async () => {
            try {
                const response = await fetch(`${server}payrollQueries/view`);
                const data = await response.json();
                setQueries(data);
            } catch (error) {
                console.error('Error fetching payroll queries:', error);
            }
        };

        const fetchData = async () => {
            await fetchQueries();
        };

        fetchData();
    }, [queries]);

    // Filter queries based on the selected status
    const filteredQueries = queries.filter(query => {
        if (filterStatus === 'all') return true;
        return query.status === filterStatus;
    });

    // Open the modal for responding to a query
    const handleRespondClick = (query) => {
        setSelectedQuery(query);
        setResponse(query.response || '');
        setStatus('In Progress');
        setShowModal(true);
    };

    // Close the modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedQuery(null);
        setResponse('');
    };

    // Submit the response to the backend
    const updateQuery = async () => {
        if (selectedQuery) {
            const queryData = { response, status };

            try {
                const fetchResponse = await fetch(`${server}payrollQueries/respond/${selectedQuery.query_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(queryData)
                });

                const data = await fetchResponse.json();
                console.log(data.message);
                closeModal();
            } catch (error) {
                console.error('Error updating payroll query:', error);
            }
        }
    };

    return (
        <div className="container">
            <h2>All Payroll Queries</h2>
            
            {/* Status Filter Dropdown */}
            <div className="status-filter">
                <label htmlFor="status">Filter by Status:</label>
                <select
                    id="status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="status-dropdown"
                >
                    <option value="all">All</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                </select>
            </div>

            <div className="query-list">
                {filteredQueries.map((query) => (
                    <div key={query.query_id} className="query-item">
                        <div className="query-header">
                            <p className="query-user"><strong>User:</strong> {query.fname} {query.lname}</p>
                            <p className="query-date"><strong>Date:</strong> {new Date(query.query_date).toLocaleString()}</p>
                        </div>
                        <div className="query-body">
                            <p><strong>Description:</strong> {query.description}</p>
                            <p><strong>Status:</strong> <span className={`status ${query.status.toLowerCase()}`}>{query.status}</span></p>
                            <p><strong>Response:</strong> {query.response || 'Awaiting response'}</p>
                        </div>
                        <div className="query-footer">
                            <button onClick={() => handleRespondClick(query)} className="response-btn">Respond</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Respond to Payroll Query</h2>
                        <p><strong>Description:</strong> {selectedQuery.description}</p>
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Enter your response"
                        ></textarea>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="status-dropdown">
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>

                        <button onClick={updateQuery} className="update-btn">Update</button>
                        <button onClick={closeModal} className="close-button">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollQueriesPage;
