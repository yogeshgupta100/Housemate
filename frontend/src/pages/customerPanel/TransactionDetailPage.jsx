import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Download, Clock, CheckCircle, XCircle, User, Calendar, DollarSign } from 'lucide-react';
import PageHeader from '../../components/customerPanel/common/PageHeader';
import PropertyCard from '../../components/customerPanel/profile/ProfileCard';
import InvoicePreview from '../../components/customerPanel/transactions/InvoicePreview';
import AgreementPreview from '../../components/customerPanel/transactions/AgreementPreview';
import { useAuth } from '../../context/AuthContext.jsx';
import { Backendurl } from '../../App.jsx';
import { toast } from 'react-toastify';
const TransactionDetailPage = () => {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const {user} = useAuth();
  console.log("user", user);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await fetch(`${Backendurl}/api/transactions/${id}`);
        const data = await res.json();
        if (data.success && data.transaction) {
          setTransaction(data.transaction);
          
          // Mock invoice data
          const mockInvoice = {
            invoiceNumber: `INV-${data.transaction.id}-${Date.now().toString().slice(-4)}`,
            date: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            items: [
              {
                description: `${data.transaction.type} of ${data.transaction.property?.title || 'Property'}`,
                amount: data.transaction.amount || data.transaction.property_price || 0
              }
            ],
            taxes: [
              {
                description: 'GST',
                percentage: 18,
                amount: (data.transaction.amount || data.transaction.property_price || 0) * 0.18
              },
              {
                description: 'Registration Fee',
                percentage: 1,
                amount: (data.transaction.amount || data.transaction.property_price || 0) * 0.01
              }
            ],
            amount: data.transaction.amount || data.transaction.property_price || 0,
            totalAmount: (data.transaction.amount || data.transaction.property_price || 0) * 1.19,
            paidAmount: data.transaction.amount || data.transaction.property_price || 0,
            dueAmount: (data.transaction.amount || data.transaction.property_price || 0) * 0.19
          };
          setInvoice(mockInvoice);

          // Mock agreement data
          const mockAgreement = {
            agreementNumber: `AGR-${data.transaction.id}-${Date.now().toString().slice(-4)}`,
            date: new Date().toISOString(),
            parties: {
              seller: {
                name: data.transaction.seller?.name || 'Property Owner',
                address: data.transaction.seller?.address || '123 Seller Street',
                city: data.transaction.seller?.city || 'Mumbai',
                state: data.transaction.seller?.state || 'Maharashtra',
                zip: data.transaction.seller?.zip || '400001',
                email: data.transaction.seller?.email || 'seller@example.com',
                phone: data.transaction.seller?.phone || '+91 98765 43210'
              },
              buyer: {
                name: `${user?.data?.first_name || 'John'} ${user?.data?.last_name || 'Doe'}`,
                address: user?.data?.address || '456 Buyer Avenue',
                city: user?.data?.city || 'Mumbai',
                state: user?.data?.state || 'Maharashtra',
                zip: user?.data?.zip || '400002',
                email: user?.data?.email || 'buyer@example.com',
                phone: user?.data?.phone || '+91 98765 43211'
              }
            },
            property: {
              title: data.transaction.property?.title || 'Luxury Apartment',
              description: data.transaction.property?.description || 'A beautiful property in a prime location',
              location: data.transaction.property?.location || 'Downtown',
              city: data.transaction.property?.city || 'Mumbai',
              state: data.transaction.property?.state || 'Maharashtra',
              type: data.transaction.property?.type || 'Apartment',
              area: data.transaction.property?.area || '1200',
              bedrooms: data.transaction.property?.bedrooms || 3,
              bathrooms: data.transaction.property?.bathrooms || 2,
              price: data.transaction.amount || data.transaction.property_price || 0
            },
            terms: [
              'The property will be delivered in the same condition as shown during the inspection.',
              'All necessary documents and clearances will be provided by the seller.',
              'The buyer agrees to complete all payments as per the agreed schedule.',
              'The seller warrants that the property is free from any legal encumbrances.',
              'Both parties agree to complete the registration process within 30 days of this agreement.'
            ],
            signatures: {
              seller: '_________________',
              buyer: '_________________'
            }
          };
          setAgreement(mockAgreement);
        } else {
          toast.error("Transaction not found");
          setTransaction(null);
        }
      } catch (err) {
        toast.error("Fetch error");
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id, user]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading transaction details...</div>;
  }

  if (!transaction) {
    return <div className="flex justify-center items-center h-full">Transaction not found.</div>;
  }

  const property = {
    ...transaction.property,
    images: Array.isArray(transaction.property?.images)
      ? transaction.property.images
      : (transaction.property_images || []),
  };
  const amount = transaction.amount || Number(transaction.property_price) || 0;
  const status = transaction.status || 'Pending';
  const type = transaction.type || 'Rent';
  const date = transaction.created_at || transaction.date;
  const documents = transaction.documents || {};
  const seller = transaction.seller || {};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
    <div>
      <PageHeader 
        title="Transaction Details" 
        description={`Details for transaction #${transaction.id}`}
        backLink={
          <Link to="/customer-panel/transactions" className="flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Transactions
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap gap-4 mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeClass()}`}>
          {type}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusClass()}`}>
          {getStatusIcon()}
          <span className="ml-1">{status}</span>
        </span>
      </div>

      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          {invoice && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'invoice'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('invoice')}
            >
              Invoice
            </button>
          )}
          {agreement && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'agreement'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('agreement')}
            >
              Agreement
            </button>
          )}
        </div>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Transaction Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Transaction ID</span>
                      <span className="font-medium">{transaction.id}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Date</span>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium">{formatDate(date)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Type</span>
                      <span className="font-medium">{type}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Status</span>
                      <div className="flex items-center">
                        {getStatusIcon()}
                        <span className="font-medium ml-2">{status}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Amount</span>
                      <div className="flex items-center">
                        {/* <DollarSign className="w-4 h-4 text-gray-400 mr-2" /> */}
                        <span className="font-medium text-xl">{formatCurrency(amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Parties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Buyer
                    </h4>
                    <div>
                      <p className="font-medium">{user?.data?.first_name} {user?.data?.last_name}</p>
                      <p className="text-sm text-gray-500">{user?.data?.email}</p>
                      {/* <p className="text-sm text-gray-500">{user?.data?.phone}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {transaction.buyer?.address}, {transaction.buyer?.city}, {transaction.buyer?.state} {transaction.buyer?.zip}
                      </p> */}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Seller
                    </h4>
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-sm text-gray-500">{seller.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                <div className="flex flex-wrap gap-4">
                  {documents.invoice && (
                    <a 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('invoice');
                      }}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View Invoice
                    </a>
                  )}
                  {documents.agreement && (
                    <a 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('agreement');
                      }}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View Agreement
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Property Information</h3>
            <PropertyCard property={property} isCompact />
          </div>
        </div>
      )}

      {activeTab === 'invoice' && invoice && <InvoicePreview invoice={invoice} transaction={transaction} />}
      {activeTab === 'agreement' && agreement && <AgreementPreview agreement={agreement} />}
    </div>
  );
};

export default TransactionDetailPage;