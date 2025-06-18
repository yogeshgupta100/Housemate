import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Backendurl } from '../../config/index.js';
import { toast } from 'react-toastify';

const RoomAvailabilityRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${Backendurl}/api/admin/room-availability-requests`);
      setRequests(res.data.requests);
    } catch {
      toast.error('Failed to fetch requests');
    }
  };

  const handleAccept = async (id) => {
    try {
      await axios.post(`${Backendurl}/api/admin/room-availability-requests/${id}/accept`);
      toast.success('Request accepted and room made available!');
      setRequests(requests.filter(r => r.id !== id));
    } catch {
      toast.error('Failed to accept request');
    }
  };

  return (
    <div>
      <h2>Pending "Make it Available" Requests</h2>
      <table>
        <thead>
          <tr>
            <th>Room</th>
            <th>Property</th>
            <th>Owner</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id}>
              <td>{req.room_number}</td>
              <td>{req.property_title}</td>
              <td>{req.owner_name}</td>
              <td>
                <button onClick={() => handleAccept(req.id)}>Accept</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoomAvailabilityRequests; 