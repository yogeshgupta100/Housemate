import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Clock, CheckCircle, XCircle } from 'lucide-react';

const TransactionCard = ({ transaction }) => {
  const { id, type, status, amount, property, date, documents } = transaction;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'Purchase':
        return 'bg-blue-100 text-blue-800';
      case 'Sale':
        return 'bg-purple-100 text-purple-800';
      case 'Rent':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeClass()}`}>
            {type}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass()}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
        <p className="text-gray-600 mb-3">
          {property.location}, {property.city}, {property.state}
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

        <div className="flex flex-wrap gap-2 mb-4">
          {documents.invoice && (
            <a 
              href="#"
              className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Invoice
            </a>
          )}
          {documents.agreement && (
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
              {status === 'Pending' ? 'Awaiting confirmation' : status}
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