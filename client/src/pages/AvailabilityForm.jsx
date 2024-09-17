import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AvailabilityForm = () => {
    const [availabilityList, setAvailabilityList] = useState([]);
    const [formData, setFormData] = useState({
        available_date: '',
        start_time: '',
        end_time: '',
        status: 'available',
    });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const response = await axios.get('http://localhost:8800/availability');
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
            status: 'available',
        });
        setEditingId(null);
        fetchAvailability();
    };

    const createAvailability = async () => {
        try {
            await axios.post('http://localhost:8800/availability', formData);
        } catch (error) {
            console.error('Error creating availability:', error);
        }
    };

    const updateAvailability = async () => {
        try {
            await axios.put(`http://localhost:8800/availability/${editingId}`, formData);
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    const handleEdit = (id) => {
        const availability = availabilityList.find(item => item.availability_id === id);
        setFormData({
            available_date: availability.available_date,
            start_time: availability.start_time,
            end_time: availability.end_time,
            status: availability.status,
        });
        setEditingId(id);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8800/availability/${id}`);
            fetchAvailability();
        } catch (error) {
            console.error('Error deleting availability:', error);
        }
    };

    return (
        <div>
            <h2>Availability Preferences</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Date:</label>
                    <input
                        type="date"
                        name="available_date"
                        value={formData.available_date}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label>Start Time:</label>
                    <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label>End Time:</label>
                    <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label>Status:</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                    </select>
                </div>
                <button type="submit">{editingId ? 'Update' : 'Create'}</button>
            </form>

            <h3>Existing Availability</h3>
            <ul>
                {availabilityList.map(item => (
                    <li key={item.availability_id}>
                        {item.available_date} - {item.start_time} to {item.end_time} ({item.status})
                        <button onClick={() => handleEdit(item.availability_id)}>Edit</button>
                        <button onClick={() => handleDelete(item.availability_id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AvailabilityForm;
