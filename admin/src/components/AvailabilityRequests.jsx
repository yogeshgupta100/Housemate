import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Building,
  MapPin,
  Clock,
  User,
  XCircle,
} from "lucide-react";
import { backendurl } from "../App";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AvailabilityRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: "",
    requestId: null,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        `${backendurl}/api/admin/room-availability-requests`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        console.log("Received requests:", response.data.requests);
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to fetch availability requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type, requestId) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const url = `${backendurl}/api/admin/room-availability-requests/${requestId}/${type}`;
      const response = await axios.post(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        toast.success(
          `Request ${type === "accept" ? "approved" : "rejected"} successfully`
        );
        fetchRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${type} request`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
      setConfirmDialog({ open: false, type: "", requestId: null });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 my-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8 my-14"
    >
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Availability Requests
        </h1>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-500">No pending availability requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition cursor-pointer border border-gray-100 hover:border-blue-300"
                onClick={() =>
                  navigate(`/availability-requests/${request.id}`, {
                    state: { requestData: request },
                  })
                }
              >
                <div className="flex items-center gap-3 mb-4">
                  <Building className="h-6 w-6 text-blue-500" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {request.property_title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <MapPin className="h-4 w-4" />
                      {request.location}
                    </div>
                  </div>
                  <span
                    className={`ml-auto px-2 py-1 rounded text-xs font-semibold ${
                      request.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : request.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </span>
                </div>
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>
                      {request.first_name} {request.last_name} (
                      {request.user_type})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Room:</span>
                    <span>{request.room_number}</span>
                    <span className="font-medium text-gray-700 ml-4">
                      Floor:
                    </span>
                    <span>{request.floor_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">
                      Requested:
                    </span>
                    <span>
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDialog({
                        open: true,
                        type: "accept",
                        requestId: request.id,
                      });
                    }}
                    disabled={actionLoading[request.id]}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDialog({
                        open: true,
                        type: "reject",
                        requestId: request.id,
                      });
                    }}
                    disabled={actionLoading[request.id]}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {confirmDialog.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                {confirmDialog.type === "accept" ? "Approve" : "Reject"} Request
              </h3>
              <p className="mb-6 text-gray-700">
                Are you sure you want to{" "}
                {confirmDialog.type === "accept" ? "approve" : "reject"} this
                request?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() =>
                    setConfirmDialog({ open: false, type: "", requestId: null })
                  }
                  className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAction(confirmDialog.type, confirmDialog.requestId)
                  }
                  className={`px-4 py-2 rounded text-white ${
                    confirmDialog.type === "accept"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading[confirmDialog.requestId]
                    ? "Processing..."
                    : confirmDialog.type === "accept"
                    ? "Approve"
                    : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AvailabilityRequests;
