import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import moment from "moment";
import "../style.css";

function Schedule() {
  const [date, setDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [shiftDetails, setShiftDetails] = useState({
    shift_date: moment(new Date()).format("YYYY-MM-DD"), // Initialize with current date in yyyy-mm-dd format
    start_time: "",
    end_time: "",
    salary: "", // New state for salary
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch("http://localhost:8800/schedules");
        const data = await response.json();
        setSchedules(data);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      }
    }

    fetchSchedules();

  }, []);

  const onChange = (date) => {
    setDate(date);
    const formattedDate = moment(date).format("YYYY-MM-DD");
    setShiftDetails({
      ...shiftDetails,
      shift_date: formattedDate,
    });
  };

  const renderSchedules = (date) => {
    const daySchedules = schedules.filter((schedule) =>
      moment(schedule.shift_date).isSame(date, "day")
    );

    return daySchedules.length > 0 ? (
      <ul>
        {daySchedules.map((schedule) => (
          <li key={schedule.schedule_id}>
            Shift: {schedule.start_time} - {schedule.end_time}
            <button onClick={() => handleEditClick(schedule)}>Edit</button>
            <button onClick={() => handleDeleteClick(schedule.schedule_id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p>No schedules for this day.</p>
    );

  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShiftDetails({ ...shiftDetails, [name]: value });
  };

  const handleAddClick = () => {
    setShiftDetails({
      shift_date: moment(new Date()).format("YYYY-MM-DD"), // Reset to current date
      start_time: "",
      end_time: "",
      salary: "",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (schedule) => {
    setEditingId(schedule.schedule_id);
    setShiftDetails({
      shift_date: schedule.shift_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      salary: schedule.salary || "",
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (schedule_id) => {
    fetch(`http://localhost:8800/deleteSchedules/${schedule_id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        setSchedules(
          schedules.filter((sched) => sched.schedule_id !== schedule_id)
        );
      })
      .catch((err) => console.error("Error deleting schedule:", err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { shift_date, start_time, end_time, salary } = shiftDetails;
    const url = isEditing
      ? `http://localhost:8800/updateSchedules/${editingId}`
      : "http://localhost:8800/addSchedules";
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shift_date, start_time, end_time, salary }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditing) {
          setSchedules(
            schedules.map((sched) =>
              sched.schedule_id === editingId
                ? { ...sched, shift_date, start_time, end_time, salary }
                : sched
            )
          );
        } else {
          setSchedules([
            ...schedules,
            { schedule_id: data.id, shift_date, start_time, end_time, salary },
          ]);
        }
        setIsModalOpen(false);
        setIsEditing(false);
        setEditingId(null);
        alert("Shift saved successfully");
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Failed to save shift");
      });
  };

  return (
    <div className="schedule-container">
      <h2>Employee Schedule</h2>
      <Calendar onChange={onChange} value={date} />
      <div className="schedule-details">
        <h3>Schedules for {moment(date).format("DD/MM/YYYY")}</h3>
        {renderSchedules(date)}
      </div>

      <button onClick={handleAddClick}>Add Shift</button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? "Edit Shift" : "Add Shift"}</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label>Shift Date:</label>
                <input
                  type="date" // Changed to date type for better compatibility with browsers
                  name="shift_date"
                  value={shiftDetails.shift_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Start Time:</label>
                <input
                  type="time"
                  name="start_time"
                  value={shiftDetails.start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>End Time:</label>
                <input
                  type="time"
                  name="end_time"
                  value={shiftDetails.end_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Salary per Hour:</label>
                <input
                  type="number"
                  name="salary"
                  value={shiftDetails.salary}
                  onChange={handleInputChange}
                  placeholder="Enter salary"
                  required
                />
              </div>
              <button type="submit">
                {isEditing ? "Update Shift" : "Add Shift"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
