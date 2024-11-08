import React, { useEffect, useState } from 'react';

const ReviewShiftSwapping = () => {
  const [swapRequests, setSwapRequests] = useState([]);
  const [error, setError] = useState(null);
  const server = process.env.REACT_APP_SERVER;
  const tokenObj = localStorage.getItem("token") ? JSON.parse(atob(localStorage.getItem("token").split('.')[1])) : null;
  const userId = tokenObj ? tokenObj.id : null;

  useEffect(() => {
    const fetchSwapRequests = async () => {
      try {
        const response = await fetch(`${server}shiftSwapRequests/pending`);
        if (!response.ok) {
          throw new Error('Failed to fetch shift swap requests');
        }
        const data = await response.json();
        setSwapRequests(data.swapRequests);
      } catch (err) {
        console.error('Error fetching shift swap requests:', err);
        setError('Failed to load shift swap requests');
      }
    };

    fetchSwapRequests();
  }, [server]);

  const handleAction = async (swap_id, status) => {
    try {
      const response = await fetch(`${server}shiftSwapRequests/handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ swap_id, status }),
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to ${status} swap request: ${errorMessage}`);
      }
  
      const data = await response.json();
      alert(data.message);
  
      // Refresh the swap requests list after approving or rejecting
      setSwapRequests((prevRequests) =>
        prevRequests.filter((request) => request.swap_id !== swap_id)
      );
    } catch (err) {
      console.error(`Error trying to ${status} swap request:`, err);
      setError(`Failed to ${status} swap request: ${err.message}`);
    }
  };

  return (
    <div>
      <h1>Review Shift Swapping Requests</h1>
      {error && <p className="error">{error}</p>}
      {swapRequests.length === 0 ? (
        <p>No pending shift swap requests found</p>
      ) : (
        <ul>
          {swapRequests.map((request) => (
            <li key={request.swap_id}>
              <p><strong>Requestor UserID:</strong> {request.userid}</p>
              <p><strong>Requestor Name:</strong> {request.requestor_fname} {request.requestor_lname}</p>
              <p><strong>Requestor Assignment ID:</strong> {request.requestor_assignment_id}</p>
              <p><strong>Target Assignment ID:</strong> {request.target_assignment_id}</p>
              <p><strong>Status:</strong> {request.status}</p>
              <button onClick={() => handleAction(request.swap_id, 'approved')}>Approve</button>
              <button onClick={() => handleAction(request.swap_id, 'rejected')}>Reject</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewShiftSwapping;