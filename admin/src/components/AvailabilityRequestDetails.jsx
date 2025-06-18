import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { backendurl } from '../App';
import { toast } from 'react-hot-toast';

const AvailabilityRequestDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const [details, setDetails] = useState(location.state?.requestData || null);
  const [loading, setLoading] = useState(!details);

  useEffect(() => {
    if (details) return; // Already have data from navigation
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`${backendurl}/api/admin/room-availability-requests/${id}`);
        if (res.data.success) {
          setDetails(res.data.details);
        } else {
          toast.error('Request not found');
        }
      } catch (err) {
        toast.error('Failed to fetch request details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, details]);

  if (loading) return <div>Loading...</div>;
  if (!details) return <div>Request not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow mt-14">
      <h2 className="text-2xl font-bold mb-4">Availability Request Details</h2>
      <div className="mb-4">
        <strong>Request ID:</strong> {details.id}
      </div>
      <div className="mb-4">
        <strong>Status:</strong> {details.status}
      </div>
      <div className="mb-4">
        <strong>Requested At:</strong> {new Date(details.created_at).toLocaleString()}
      </div>
      <hr className="my-4" />
      <h3 className="text-xl font-semibold mb-2">User Details</h3>
      <div className="mb-2">Name: {details.first_name} {details.last_name}</div>
      <div className="mb-2">Email: {details.email}</div>
      <div className="mb-2">Phone: {details.phone}</div>
      <div className="mb-2">User Type: {details.user_type}</div>
      <hr className="my-4" />
      <h3 className="text-xl font-semibold mb-2">Property Details</h3>
      <div className="mb-2">Title: {details.title}</div>
      <div className="mb-2">Location: {details.location}</div>
      <div className="mb-2">Type: {details.type}</div>
      <div className="mb-2">Listing Type: {details.listing_type}</div>
      <div className="mb-2">Price: ₹{details.price}</div>
      <hr className="my-4" />
      <h3 className="text-xl font-semibold mb-2">Floor Details</h3>
      <div className="mb-2">Floor Number: {details.floor_number}</div>
      <hr className="my-4" />
      <h3 className="text-xl font-semibold mb-2">Room Details</h3>
      <div className="mb-2">Room Number: {details.room_number}</div>
      <div className="mb-2">Room Type: {details.room_type}</div>
      <div className="mb-2">Area: {details.area}</div>
      <div className="mb-2">Description: {details.description}</div>
      <div className="mb-2">Rent Amount: ₹{details.rent_amount}</div>
      <div className="mb-2">Capacity: {details.capacity}</div>
      <div className="mb-2">Occupied: {details.occupied}</div>
    </div>
  );
};

export default AvailabilityRequestDetails; 