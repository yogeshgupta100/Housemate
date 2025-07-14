import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  CalendarDays,
} from "lucide-react";

const TransactionCard = ({ transaction }) => {
  const {
    id,
    type,
    status,
    amount,
    property,
    date,
    documents,
    move_in_date,
    lease_period,
    lease_end_date,
  } = transaction;

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "active":
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "active":
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeClass = () => {
    const listingType = property?.listing_type;
    switch (listingType) {
      case "sale":
        return "bg-purple-100 text-purple-800";
      case "rent":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = () => {
    const listingType = property?.listing_type;
    switch (listingType) {
      case "sale":
        return "Purchase";
      case "rent":
        return "Rent";
      default:
        return "Transaction";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "pending":
        return "Pending";
      case "active":
        return "Active";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const isExpired = () => {
    if (!lease_end_date) return false;
    const endDate = new Date(lease_end_date);
    const currentDate = new Date();
    return currentDate > endDate;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative">
        <img
          src={property?.images?.[0]}
          alt={property?.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeClass()}`}
          >
            {getTypeLabel()}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass()}`}
          >
            {getStatusLabel()}
          </span>
          {isExpired() && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Expired
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">{property?.title}</h3>
        <p className="text-gray-600 mb-3">
          {property?.location}, {property?.city}, {property?.state}
        </p>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500">Transaction Date</p>
            <p className="font-medium">{formatDate(date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="font-medium text-xl">{formatCurrency(amount)}</p>
          </div>
        </div>

        {/* Lease Information for Rent Properties */}
        {property?.listing_type === "rent" && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  Move-in Date
                </div>
                <p className="font-medium text-sm">
                  {formatDate(move_in_date)}
                </p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <CalendarDays className="w-4 h-4 mr-1" />
                  Lease Period
                </div>
                <p className="font-medium text-sm">
                  {lease_period || "Not specified"}
                </p>
              </div>
            </div>
            {lease_end_date && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <CalendarDays className="w-4 h-4 mr-1" />
                  Lease End Date
                </div>
                <p
                  className={`font-medium text-sm ${
                    isExpired() ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatDate(lease_end_date)}
                  {isExpired() && " (Expired)"}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {documents?.invoice && (
            <a
              href="#"
              className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Invoice
            </a>
          )}
          {documents?.agreement && (
            <a
              href="#"
              className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Agreement
            </a>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="ml-1.5 text-sm font-medium">
              {status === "pending"
                ? "Awaiting confirmation"
                : getStatusLabel()}
            </span>
          </div>

          <Link
            to={`/customer-panel/transactions/${id}`}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
