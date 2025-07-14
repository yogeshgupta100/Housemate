import React, { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Calendar,
  Building,
  BedDouble,
  Bath,
  Maximize,
  Users,
  ArrowLeft,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Link as LinkIcon,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { backendurl } from "../App";
import { toast } from "react-hot-toast";
import axios from "axios";
import { debounce } from "lodash";
import SceneUploader from "./PropertyDetail/SceneUploader.jsx";
import PropertySceneUploader from "./PropertyDetail/PropertySceneUploader.jsx";

const PropertyDetails = ({ property, onRemove }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showMapTenantModal, setShowMapTenantModal] = useState(false);
  const [showMapUserModal, setShowMapUserModal] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [userId, setUserId] = useState("");
  const [expandedFloors, setExpandedFloors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Initialize expanded state for floors
  useEffect(() => {
    if (property?.floorDetails) {
      const initialExpandedState = {};
      property.floorDetails.forEach((floor) => {
        initialExpandedState[floor.id] = false;
      });
      setExpandedFloors(initialExpandedState);
    }
  }, [property?.floorDetails]);

  const toggleFloor = (floorId) => {
    setExpandedFloors((prev) => ({
      ...prev,
      [floorId]: !prev[floorId],
    }));
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder.jpg";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${backendurl}/uploads/${imageUrl.split("/uploads/").pop()}`;
  };

  const handleRemoveProperty = async () => {
    if (
      window.confirm(`Are you sure you want to remove "${property.title}"?`)
    ) {
      try {
        const response = await fetch(
          `${backendurl}/api/properties/${property.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          toast.success("Property removed successfully");
          navigate("/list");
        } else {
          toast.error(data.message || "Failed to remove property");
        }
      } catch (error) {
        console.error("Error removing property:", error);
        toast.error("Failed to remove property");
      }
    }
  };

  // Debounced search function
  const searchUsers = debounce(async (query) => {
    if (!query) {
      setUserSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${backendurl}/api/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setUserSuggestions(data.users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedUser(null);
    searchUsers(query);
    setShowSuggestions(true);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.name);
    setPhoneNumber(user.phone);
    setUserSuggestions([]);
    setShowSuggestions(false);
  };

  const handleMapTenant = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }
    if (!moveInDate) {
      toast.error("Please select move-in date");
      return;
    }

    try {
      // Get lease period from property availability or use default
      const leasePeriod = property.availability?.minLeasePeriod || "11 months";

      const response = await axios.post(
        `${backendurl}/api/transactions/map-tenant`,
        {
          room_id: selectedRoom.id,
          user_id: selectedUser.id,
          move_in_date: moveInDate,
          rent_amount: selectedRoom.rent,
          deposit_amount: depositAmount || 0, // Make deposit optional, default to 0
          payment_method: "cash", // Enforce cash-only payment for admin mapping
          lease_period: leasePeriod,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Tenant mapped successfully with cash payment");
        setShowMapTenantModal(false);
        // Reset form
        setSearchQuery("");
        setSelectedUser(null);
        setPhoneNumber("");
        setMoveInDate("");
        setDepositAmount("");
        // Refresh property data
        window.location.reload();
      } else {
        toast.error(response.data.message || "Failed to map tenant");
      }
    } catch (error) {
      console.error("Error mapping tenant:", error);
      toast.error(error.response?.data?.message || "Failed to map tenant");
    }
  };

  const handleMapUser = async () => {
    try {
      const response = await axios.post(
        `${backendurl}/api/properties/map-user`,
        {
          property_id: property.id,
          user_id: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Property mapped to user successfully");
        setShowMapUserModal(false);
        // Refresh property data
        window.location.reload();
      } else {
        toast.error(response.data.message || "Failed to map property to user");
      }
    } catch (error) {
      console.error("Error mapping property to user:", error);
      toast.error(
        error.response?.data?.message || "Failed to map property to user"
      );
    }
  };

  const calculateEndDate = (startDate, leasePeriod) => {
    if (!startDate || !leasePeriod) return null;

    const date = new Date(startDate);
    const [number, unit] = leasePeriod.split(" ");
    const months = unit.toLowerCase().includes("month")
      ? parseInt(number)
      : parseInt(number) * 12;

    date.setMonth(date.getMonth() + months);
    return date;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8 my-14"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Property Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {property.title}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/update/${property.id}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Property
              </button>
              <button
                onClick={handleRemoveProperty}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative h-96">
                <img
                  src={getImageUrl(property.images?.[activeImageIndex])}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder.jpg";
                  }}
                />
                {property.images?.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === activeImageIndex
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {property.images?.length > 1 && (
                <div className="p-4 grid grid-cols-4 gap-2">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-20 rounded-lg overflow-hidden ${
                        index === activeImageIndex ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {property.title}
              </h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                {property.location}
              </div>
              <div className="flex items-center text-gray-600 mb-6">
                <Phone className="w-5 h-5 mr-2" />
                {property.phone}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.beds > 0 && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <BedDouble className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{property.beds} Beds</span>
                  </div>
                )}
                {property.baths > 0 && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Bath className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {property.baths} Baths
                    </span>
                  </div>
                )}
                {property.sqft > 0 && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Maximize className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{property.sqft} sqft</span>
                  </div>
                )}
                {property.type === "pg" && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{property.pg_type} PG</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Description
                </h2>
                <p className="text-gray-600 whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <Building className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Details and Status */}
          <div className="space-y-6">
            {/* Price and Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-blue-600 mb-2">
                  ₹{parseFloat(property.price).toLocaleString()}
                  {property.listing_type === "rent" && (
                    <span className="text-sm font-normal text-gray-500">
                      /{property.rent_type}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      property.listing_type === "rent"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    For {property.listing_type === "rent" ? "Rent" : "Sale"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      property.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {property.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Property Type</span>
                  <span className="font-medium">{property.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Furnishing</span>
                  <span className="font-medium">{property.furnishing}</span>
                </div>
                {property.deposit > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Deposit</span>
                    <span className="font-medium">
                      ₹{parseFloat(property.deposit).toLocaleString()}
                    </span>
                  </div>
                )}
                {property.property_age && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Property Age</span>
                    <span className="font-medium">
                      {property.property_age} years
                    </span>
                  </div>
                )}
                {property.property_condition && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Condition</span>
                    <span className="font-medium">
                      {property.property_condition}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Availability */}
            {property.availability && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Availability
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`inline-flex items-center ${
                        property.availability.status === "Available"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {property.availability.status === "Available" ? (
                        <CheckCircle2 className="w-5 h-5 mr-1" />
                      ) : (
                        <Clock className="w-5 h-5 mr-1" />
                      )}
                      {property.availability.status}
                    </span>
                  </div>
                  {property.availability.availableFrom && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Available From</span>
                      <span className="font-medium">
                        {new Date(
                          property.availability.availableFrom
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {property.availability.minLeasePeriod && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        Minimum Lease Period
                      </span>
                      <span className="font-medium">
                        {property.availability.minLeasePeriod}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Features
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  {property.balcony ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Balcony</span>
                </div>
                <div className="flex items-center">
                  {property.central_ac ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Central AC</span>
                </div>
                <div className="flex items-center">
                  {property.power_backup ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Power Backup</span>
                </div>
                <div className="flex items-center">
                  {property.parking ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Parking</span>
                </div>
                <div className="flex items-center">
                  {property.security ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Security</span>
                </div>
                <div className="flex items-center">
                  {property.lift ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-gray-600">Lift</span>
                </div>
              </div>
            </div>

            {/* Property-Specific Details */}
            {property.listing_type === "sale" && (
              <>
                {/* Office-Specific Details */}
                {property.type === "office" && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Office Details
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {property.office_area && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Area</span>
                          <span className="font-medium">
                            {property.office_area} sq ft
                          </span>
                        </div>
                      )}
                      {property.office_floors && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Floors</span>
                          <span className="font-medium">
                            {property.office_floors}
                          </span>
                        </div>
                      )}
                      {property.office_capacity && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Capacity</span>
                          <span className="font-medium">
                            {property.office_capacity} people
                          </span>
                        </div>
                      )}
                      {property.office_cabins && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Cabins</span>
                          <span className="font-medium">
                            {property.office_cabins}
                          </span>
                        </div>
                      )}
                      {property.meeting_rooms && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Meeting Rooms</span>
                          <span className="font-medium">
                            {property.meeting_rooms}
                          </span>
                        </div>
                      )}
                      {property.head_cabins && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Head Cabins</span>
                          <span className="font-medium">
                            {property.head_cabins}
                          </span>
                        </div>
                      )}
                    </div>
                    {property.office_amenities &&
                      property.office_amenities.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-2">
                            Office Amenities
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {property.office_amenities.map((amenity, index) => (
                              <div
                                key={index}
                                className="flex items-center text-gray-600"
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                                {amenity}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Plot-Specific Details */}
                {(property.type === "commercial plot" ||
                  property.type === "residential plot") && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Plot Details
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {property.plot_area && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Area</span>
                          <span className="font-medium">
                            {property.plot_area} sq ft
                          </span>
                        </div>
                      )}
                      {property.nearby_area && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Nearby Area</span>
                          <span className="font-medium">
                            {property.nearby_area}
                          </span>
                        </div>
                      )}
                      {property.estimated_rental_income && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            Estimated Rental Income
                          </span>
                          <span className="font-medium">
                            ₹
                            {Number(
                              property.estimated_rental_income
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Under Committee</span>
                        <span className="font-medium">
                          {property.under_committee ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          Passed Building Land
                        </span>
                        <span className="font-medium">
                          {property.passed_building_land ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Builder Floor/House-Specific Details */}
                {(property.type === "builder floor" ||
                  property.type === "house") && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {property.type === "builder floor"
                        ? "Builder Floor"
                        : "House"}{" "}
                      Details
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {property.type === "builder floor" &&
                        property.builder_floors && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">
                              Number of Floors
                            </span>
                            <span className="font-medium">
                              {property.builder_floors}
                            </span>
                          </div>
                        )}
                      {property.house_area && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Area</span>
                          <span className="font-medium">
                            {property.house_area} sq ft
                          </span>
                        </div>
                      )}
                      {property.house_bedrooms && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Bedrooms</span>
                          <span className="font-medium">
                            {property.house_bedrooms}
                          </span>
                        </div>
                      )}
                      {property.house_bathrooms && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Bathrooms</span>
                          <span className="font-medium">
                            {property.house_bathrooms}
                          </span>
                        </div>
                      )}
                      {property.house_balcony && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Balconies</span>
                          <span className="font-medium">
                            {property.house_balcony}
                          </span>
                        </div>
                      )}
                      {property.house_parking && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Parking Spaces</span>
                          <span className="font-medium">
                            {property.house_parking}
                          </span>
                        </div>
                      )}
                      {property.house_location && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            Location Details
                          </span>
                          <span className="font-medium">
                            {property.house_location}
                          </span>
                        </div>
                      )}
                    </div>
                    {property.house_amenities &&
                      property.house_amenities.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-2">
                            House Amenities
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {property.house_amenities.map((amenity, index) => (
                              <div
                                key={index}
                                className="flex items-center text-gray-600"
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                                {amenity}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </>
            )}

            {/* Listing Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Listing Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Listed On</span>
                  <span className="font-medium">
                    {new Date(property.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">
                    {new Date(property.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Listing ID</span>
                  <span className="font-medium">{property.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Floors and Rooms Section */}
        {property?.floorDetails?.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Floors and Rooms
              </h2>
              <div className="space-y-4">
                {property?.floorDetails?.map((floor) => (
                  <div
                    key={floor.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFloor(floor.id)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium">
                          Floor {floor.floorNumber}
                        </span>
                      </div>
                      {expandedFloors[floor.id] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {expandedFloors[floor.id] && (
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {floor.rooms?.map((room) => (
                            <div
                              key={room.id}
                              className={`p-4 rounded-lg border ${
                                room.occupied
                                  ? "bg-red-50 border-red-200"
                                  : "bg-green-50 border-green-200"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-medium">
                                    Room {room.roomNumber}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Capacity: {room.capacity} persons
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    room.occupied
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {room.occupied ? "Occupied" : "Available"}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Rent: ₹{room.rent}</p>
                                {room.availableFrom && (
                                  <>
                                    <p>
                                      Move In Date:{" "}
                                      {new Date(
                                        room.availableFrom
                                      ).toLocaleDateString()}
                                    </p>
                                    {property.availability?.minLeasePeriod && (
                                      <p>
                                        Available Until:{" "}
                                        {calculateEndDate(
                                          room.availableFrom,
                                          property.availability.minLeasePeriod
                                        )?.toLocaleDateString()}
                                      </p>
                                    )}
                                  </>
                                )}
                                {room.hasBalcony && (
                                  <p className="text-green-600">Has Balcony</p>
                                )}
                              </div>
                              {room.occupied ? (
                                <button
                                  onClick={() => {
                                    setSelectedFloor(floor);
                                    setSelectedRoom(room);
                                    setShowMapTenantModal(true);
                                  }}
                                  className="mt-3 w-full px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                                >
                                  Map Tenant
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedFloor(floor);
                                    setSelectedRoom(room);
                                    setRentAmount(room?.rent?.toString());
                                    setShowMapTenantModal(true);
                                  }}
                                  className="mt-3 w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Map Tenant (Admin)
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add 360° Scene Uploader Section */}
        {property?.floorDetails?.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                360° Virtual Tour
              </h2>

              {/* Room Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Room
                </label>
                <select
                  value={selectedRoom?.id || ""}
                  onChange={(e) => {
                    const roomId = e.target.value;
                    if (roomId) {
                      // Find the floor and room
                      const floor = property.floorDetails.find((f) =>
                        f.rooms.some((r) => r.id === parseInt(roomId))
                      );
                      const room = floor?.rooms.find(
                        (r) => r.id === parseInt(roomId)
                      );
                      if (room) {
                        setSelectedRoom(room);
                        setSelectedFloor(floor);
                      }
                    } else {
                      setSelectedRoom(null);
                      setSelectedFloor(null);
                    }
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a room</option>
                  {property.floorDetails?.map((floor) => (
                    <optgroup
                      key={floor.id}
                      label={`Floor ${floor.floorNumber}`}
                    >
                      {floor.rooms?.map((room) => (
                        <option key={room.id} value={room.id}>
                          Room {room.roomNumber} -{" "}
                          {room.occupied ? "Occupied" : "Available"}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {selectedRoom ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Room Details
                    </p>
                    <p className="text-gray-600">
                      Floor {selectedFloor?.floorNumber}, Room{" "}
                      {selectedRoom?.roomNumber}
                    </p>
                    <p className="text-gray-600">
                      Capacity: {selectedRoom?.capacity} persons
                    </p>
                    {selectedRoom?.hasBalcony && (
                      <p className="text-green-600">Has Balcony</p>
                    )}
                  </div>
                  <SceneUploader
                    propertyId={property.id}
                    roomId={selectedRoom.id}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Please select a room to manage its 360° scenes
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Property 360° Scenes Section */}
        {property?.floorDetails?.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Property 360° Scenes
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload 360° panoramic images for the entire property
                  (available for all property types)
                </p>
              </div>
            </div>

            <PropertySceneUploader propertyId={property.id} />
          </div>
        )}
      </div>

      {/* Map Tenant Modal */}
      {showMapTenantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Map Tenant to Room (Admin)
              </h2>
              <button
                onClick={() => setShowMapTenantModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Selected Room
                </p>
                <p className="text-gray-600">
                  Floor {selectedFloor?.floorNumber}, Room{" "}
                  {selectedRoom?.roomNumber}
                </p>
                <p className="text-gray-600">
                  Capacity: {selectedRoom?.capacity} persons
                </p>
                {selectedRoom?.hasBalcony && (
                  <p className="text-green-600">Has Balcony</p>
                )}
              </div>

              {/* Cash Payment Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Cash Payment Only
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Admin tenant mapping requires cash payment only. Online
                        payment gateway is not available for this process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search User
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSuggestions(true)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Search by name, email, or phone"
                  />
                  {isLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                {showSuggestions && userSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                    {userSuggestions.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-gray-500 text-xs">
                          {user.email} • {user.phone}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move-in Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rent Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    value={selectedRoom?.rent}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount{" "}
                  <span className="text-gray-500 text-xs">
                    (Optional for admin mapping)
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter deposit amount (optional)"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to map tenant without deposit requirement
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white z-10">
                <button
                  onClick={() => setShowMapTenantModal(false)}
                  className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMapTenant}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Map Tenant (Admin)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map User Modal */}
      {showMapUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Map Property to User
              </h2>
              <button
                onClick={() => setShowMapUserModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search User
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Search by name, email, or ID"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter user's name, email, or ID to search
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowMapUserModal(false)}
                  className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMapUser}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Map User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PropertyDetails;
