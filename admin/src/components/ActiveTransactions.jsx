import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  LogOut,
  Search,
  Filter,
  Home,
} from "lucide-react";
import { backendurl } from "../App";
import { toast } from "react-hot-toast";
import axios from "axios";

const ActiveTransactions = () => {
  const [activeTransactions, setActiveTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState({});

  useEffect(() => {
    fetchActiveTransactions();
  }, []);

  const fetchActiveTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${backendurl}/api/transactions/admin/active-transactions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setActiveTransactions(response.data.activeTransactions);
      } else {
        toast.error("Failed to fetch active transactions");
      }
    } catch (error) {
      console.error("Error fetching active transactions:", error);
      toast.error("Error loading active transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCheckout = async (transactionId) => {
    if (
      !window.confirm(
        "Are you sure you want to checkout this tenant? This action cannot be undone."
      )
    ) {
      return;
    }

    setCheckoutLoading((prev) => ({ ...prev, [transactionId]: true }));

    try {
      const response = await axios.post(
        `${backendurl}/api/transactions/admin/checkout/${transactionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Remove the transaction from the list
        setActiveTransactions((prev) =>
          prev.filter(
            (transaction) => transaction.transactionId !== transactionId
          )
        );
      } else {
        toast.error(response.data.message || "Failed to checkout tenant");
      }
    } catch (error) {
      console.error("Error during admin checkout:", error);
      toast.error(error.response?.data?.message || "Error during checkout");
    } finally {
      setCheckoutLoading((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  const filteredTransactions = activeTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.propertyTitle
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.tenant.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.tenant.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.tenant.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.propertyLocation
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCity =
      !filterCity ||
      transaction.propertyCity
        ?.toLowerCase()
        .includes(filterCity.toLowerCase());

    return matchesSearch && matchesCity;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Active Transactions
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all currently active tenant rentals
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={fetchActiveTransactions}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by property, tenant name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <div className="relative">
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Cities</option>
              {[...new Set(activeTransactions.map((t) => t.propertyCity))].map(
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

        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No active transactions
            </h3>
            <p className="text-gray-500">
              {activeTransactions.length === 0
                ? "There are no active tenant rentals at the moment."
                : "No transactions match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.transactionId}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Property Header */}
                <div className="bg-blue-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <h3 className="font-semibold">
                        {transaction.propertyTitle}
                      </h3>
                    </div>
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                      {transaction.propertyLocation}, {transaction.propertyCity}
                    </span>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="p-4">
                  {/* Room Information */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Room Details
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Home className="h-4 w-4 mr-2" />
                        Room {transaction.roomNumber} (Floor{" "}
                        {transaction.floorNumber})
                      </div>
                      <div>Capacity: {transaction.roomCapacity} persons</div>
                      <div>
                        Rent: ₹{transaction.rentAmount?.toLocaleString()}
                      </div>
                      <div>
                        Deposit: ₹{transaction.depositAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Tenant Information */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Tenant Details
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {transaction.tenant.firstName}{" "}
                        {transaction.tenant.lastName}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {transaction.tenant.email}
                      </div>
                      {transaction.tenant.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {transaction.tenant.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Owner */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Property Owner
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {transaction.owner.firstName}{" "}
                        {transaction.owner.lastName}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {transaction.owner.email}
                      </div>
                      {transaction.owner.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {transaction.owner.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Moved in: {formatDate(transaction.moveInDate)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Rented since: {formatDate(transaction.rentedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() =>
                      handleAdminCheckout(transaction.transactionId)
                    }
                    disabled={checkoutLoading[transaction.transactionId]}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                  >
                    {checkoutLoading[transaction.transactionId] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Checkout Tenant
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ActiveTransactions;
