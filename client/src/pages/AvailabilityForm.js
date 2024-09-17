import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../style.css'; // Assuming the styles are in 'styles.css'

const AvailabilityForm = () => {
    const [availabilityList, setAvailabilityList] = useState([]);
    const [formData, setFormData] = useState({
        available_date: '',
        start_time: '',
        end_time: '',
        status: 'pending', // Default to 'pending'
    });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const response = await axios.get('http://localhost:8800/available');
            setAvailabilityList(response.data);
        } catch (error) {
            console.error('Error fetching availability:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            await updateAvailability();
        } else {
            await createAvailability();
        }
        setFormData({
            available_date: '',
            start_time: '',
            end_time: '',
            status: 'pending', 
        });
        setEditingId(null);
        fetchAvailability();
    };

    const createAvailability = async () => {
        try {
            await axios.post('http://localhost:8800/available', formData);
        } catch (error) {
            console.error('Error creating availability:', error);
        }
    };

    const updateAvailability = async () => {
        try {
            await axios.put(`http://localhost:8800/available/${editingId}`, formData);
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8800/available/${id}`);
            fetchAvailability();
        } catch (error) {
            console.error('Error deleting availability:', error);
        }
    };

    // Utility function to format date and time
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const adjustedHours = hours % 12 || 12;  // Convert 24-hour to 12-hour format
        return `${adjustedHours}:${minutes} ${ampm}`;
    };

    return (
        <div className="availability-form-container">
            <h2>Availability Preferences</h2>
            <form onSubmit={handleSubmit}>
                <div className="availability-form-group">
                    <label>Date:</label>
                    <input
                        type="date"
                        name="available_date"
                        value={formData.available_date}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="availability-form-group">
                    <label>Start Time:</label>
                    <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="availability-form-group">
                    <label>End Time:</label>
                    <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="availability-form-group">
                    <label>Status:</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="pending">Pending</option>
                    </select>
                </div>
                <button className="availability-button" type="submit">
                    {editingId ? 'Update' : 'Create'}
                </button>
            </form>

            <div className="availability-list">
                <h3>Existing Availability</h3>
                <ul>
                    {availabilityList.map(item => (
                        <li key={item.availability_id} className="availability-card">
                            <div>
                                <strong>User:</strong> {item.fname} {item.lname}
                            </div>
                            <div>
                                <strong>Date:</strong> {formatDate(item.available_date)}
                            </div>
                            <div>
                                <strong>Time:</strong> {formatTime(item.start_time)} - {formatTime(item.end_time)}
                            </div>
                            <div>
                                <strong>Status:</strong> 
                                <span className={item.status === 'available' ? 'status-available' : item.status === 'unavailable' ? 'status-unavailable' : 'status-pending'}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                            </div>
                            <div>
                                <button onClick={() => handleDelete(item.availability_id)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AvailabilityForm;
