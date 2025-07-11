import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Home,
  LogOut,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
} from "lucide-react";
import axios from "axios";
import { Backendurl } from "../../App.jsx";
import PageHeader from "../../components/customerPanel/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const RentedPropertiesPage = () => {
  const [rentedProperties, setRentedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    fetchRentedProperties();
  }, []);

  const fetchRentedProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${Backendurl}/api/transactions/rented-properties/me`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setRentedProperties(response.data.rentedProperties);
      } else {
        setError("Failed to fetch rented properties");
      }
    } catch (err) {
      console.error("Error fetching rented properties:", err);
      setError("Error loading rented properties");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (transactionId) => {
    if (
      !window.confirm(
        "Are you sure you want to checkout from this property? This action cannot be undone."
      )
    ) {
      return;
    }

    setCheckoutLoading((prev) => ({ ...prev, [transactionId]: true }));

    try {
      const response = await axios.post(
        `${Backendurl}/api/transactions/checkout/${transactionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Successfully checked out from the property");
        // Remove the property from the list
        setRentedProperties((prev) =>
          prev.filter((property) => property.transactionId !== transactionId)
        );
      } else {
        toast.error(response.data.message || "Failed to checkout");
      }
    } catch (err) {
      console.error("Error during checkout:", err);
      toast.error(err.response?.data?.message || "Error during checkout");
    } finally {
      setCheckoutLoading((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  const filteredProperties = rentedProperties.filter((property) => {
    const matchesSearch =
      property.propertyTitle
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      property.propertyLocation
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCity =
      !filterCity ||
      property.propertyCity?.toLowerCase().includes(filterCity.toLowerCase());
    return matchesSearch && matchesCity;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPropertyImage = (images) => {
    if (images && images.length > 0) {
      return images[0].startsWith("http")
        ? images[0]
        : `${Backendurl}${images[0]}`;
    }
    return "/placeholder-property.jpg"; // Add a placeholder image
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">{error}</div>
        <button
          onClick={fetchRentedProperties}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Rented Properties"
        description="View and manage your currently rented properties"
      />

      <div className="mt-6 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Cities</option>
              {[...new Set(rentedProperties.map((p) => p.propertyCity))].map(
                (city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                )
              )}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No rented properties
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {rentedProperties.length === 0
              ? "You haven't rented any properties yet."
              : "No properties match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property.transactionId}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Property Image */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={getPropertyImage(property.propertyImages)}
                  alt={property.propertyTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder-property.jpg";
                  }}
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Active
                </div>
              </div>

              {/* Property Details */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {property.propertyTitle}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {property.propertyLocation}, {property.propertyCity}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Home className="w-4 h-4 mr-2" />
                    Room {property.roomNumber} (Floor {property.floorNumber})
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Moved in: {formatDate(property.moveInDate)}
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Rent:</span>
                    <span className="font-semibold">
                      ₹{property.rentAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deposit:</span>
                    <span className="font-semibold">
                      ₹{property.depositAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Owner Details */}
                <div className="border-t pt-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Property Owner
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {property.owner.firstName} {property.owner.lastName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {property.owner.email}
                    </div>
                    {property.owner.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {property.owner.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => handleCheckout(property.transactionId)}
                  disabled={checkoutLoading[property.transactionId]}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  {checkoutLoading[property.transactionId] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Checkout
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentedPropertiesPage;
