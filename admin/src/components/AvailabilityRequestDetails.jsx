import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { backendurl } from "../App";
import { toast } from "react-hot-toast";
import {
  User,
  Building,
  MapPin,
  Clock,
  XCircle,
  CheckCircle2,
} from "lucide-react";

const AvailabilityRequestDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const [details, setDetails] = useState(location.state?.requestData || null);
  const [loading, setLoading] = useState(!details);

  useEffect(() => {
    if (details) return; // Already have data from navigation
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `${backendurl}/api/admin/room-availability-requests/${id}`
        );
        if (res.data.success) {
          setDetails(res.data.details);
        } else {
          toast.error("Request not found");
        }
      } catch (err) {
        toast.error("Failed to fetch request details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, details]);

  if (loading) return <div>Loading...</div>;
  if (!details) return <div>Request not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-xl mt-14">
      <div className="flex items-center gap-4 mb-6">
        <CheckCircle2 className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 flex-1">
          Availability Request Details
        </h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            details.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : details.status === "accepted"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {details.status.charAt(0).toUpperCase() + details.status.slice(1)}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" /> User Details
          </h3>
          <div className="flex items-center gap-3 mb-2">
            {details.profile_image ? (
              <img
                src={details.profile_image}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border"
              />
            ) : (
              <User className="w-12 h-12 text-gray-300 bg-gray-100 rounded-full p-2" />
            )}
            <div>
              <div className="font-medium text-gray-900">
                {details.first_name} {details.last_name}
              </div>
              <div className="text-gray-500 text-sm">{details.email}</div>
              <div className="text-gray-500 text-sm">{details.phone}</div>
              <div className="text-gray-500 text-xs mt-1">
                {details.user_type}
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-400" /> Property Details
          </h3>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Title:</span> {details.title}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <MapPin className="h-4 w-4" /> {details.location}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Type:</span> {details.type}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Listing Type:</span>{" "}
            {details.listing_type}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Price:</span> ₹{details.price}
          </div>
        </div>
      </div>
      <hr className="my-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-400" /> Floor Details
          </h3>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Floor Number:</span>{" "}
            {details.floor_number}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-400" /> Room Details
          </h3>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Room Number:</span>{" "}
            {details.room_number}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Room Type:</span> {details.room_type}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Area:</span> {details.area}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Description:</span>{" "}
            {details.description}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Rent Amount:</span> ₹
            {details.rent_amount}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Capacity:</span> {details.capacity}
          </div>
          <div className="mb-2 flex items-center gap-2 text-gray-700">
            <span className="font-medium">Occupied:</span> {details.occupied}
          </div>
        </div>
      </div>
      <hr className="my-6" />
      <div className="flex items-center gap-3 text-gray-600 text-sm">
        <Clock className="h-4 w-4" />
        <span>
          Requested At: {new Date(details.created_at).toLocaleString()}
        </span>
        <span className="ml-4">
          Request ID: <span className="font-medium">{details.id}</span>
        </span>
      </div>
    </div>
  );
};

export default AvailabilityRequestDetails;
