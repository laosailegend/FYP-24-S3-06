import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../style.css';
const server = process.env.REACT_APP_SERVER;

function Assignments() {
    const [assignments, setAssignments] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = () => {
        axios.get(`${server}assignments`)
            .then(response => {
                setAssignments(response.data);
            })
            .catch(error => {
                console.error("Error fetching assignments:", error);
                setError("Could not fetch assignments");
            });
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
    };

    const handleDelete = (assignmentId) => {
        axios.delete(`${server}assignments/${assignmentId}`)
            .then(() => {
                setAssignments(assignments.filter(a => a.assignment_id !== assignmentId));
                console.log("Assignment deleted successfully");
            })
            .catch(error => {
                console.error("Error deleting assignment:", error);
                setError("Could not delete assignment");
            });
    };

    return (
        <div className="assignments-container">
            <h1>Assignments</h1>
            {error && <p className="error-message">{error}</p>}
            {assignments.length > 0 ? (
                <table className="assignments-table">
                    <thead>
                        <tr>
                            <th>Task ID</th>
                            <th>Assigned to User ID</th>
                            <th>Assigned Date</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Name</th>
                            <th>Phone Number</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(assignment => (
                            <tr key={assignment.assignment_id}>
                                <td>{assignment.taskid}</td>
                                <td>{assignment.userid}</td>
                                <td>{formatDate(assignment.assigned_date)}</td>
                                <td>{assignment.start_time}</td>
                                <td>{assignment.end_time}</td>
                                <td>{assignment.name}</td>
                                <td>{assignment.phone}</td>
                                <td>
                                    <button onClick={() => handleDelete(assignment.assignment_id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No assignments available.</p>
            )}
        </div>
    );
}

export default Assignments;