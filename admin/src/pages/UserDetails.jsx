import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader,
  ArrowLeft,
  Building,
  Mail,
  Phone,
  User,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Globe,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { backendurl } from "../App";

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          `${backendurl}/api/admin/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch user details"
        );
        navigate("/users");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, navigate]);

  const handlePropertyClick = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 px-4 bg-gray-50 pb-36 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/users")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Users
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            User Details
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-base text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-base text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-base text-gray-900">
                        {user.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Profession</p>
                      <p className="text-base text-gray-900">
                        {user.profession || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Nationality</p>
                      <p className="text-base text-gray-900">
                        {user.nationality || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Location Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="text-base text-gray-900">
                        {user.city || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">State</p>
                      <p className="text-base text-gray-900">
                        {user.state || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="text-base text-gray-900">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User Type</p>
                    <p className="text-base text-gray-900 capitalize">
                      {user.user_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Verification Status</p>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_verified === true
                          ? "bg-green-100 text-green-800"
                          : user.is_verified === false
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.is_verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {user.user_type === "corporate" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Company Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      <p className="text-base text-gray-900">
                        {user.company_name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Registration Number
                      </p>
                      <p className="text-base text-gray-900">
                        {user.registration_number || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {user.user_type === "dealer" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Dealer Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Dealer License</p>
                      <p className="text-base text-gray-900">
                        {user.dealer_license || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Bio</p>
                    <p className="text-base text-gray-900">
                      {user.bio || "No bio provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Government ID</p>
                    <p className="text-base text-gray-900">
                      {user.govt_id_number || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Marital Status</p>
                    <p className="text-base text-gray-900 capitalize">
                      {user.marital_status || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">
              Listed Properties
            </h2>
          </div>

          {user.properties?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handlePropertyClick(property.id)}
                >
                  <div className="aspect-w-16 aspect-h-9 mb-3">
                    <img
                      src={property.images?.[0] || "/placeholder.jpg"}
                      alt={property.title}
                      className="object-cover rounded-lg w-full h-48"
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {property.title}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {property.location}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">
                      ${property.price}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        property.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No properties listed by this user
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
