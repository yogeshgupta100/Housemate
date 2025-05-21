import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Download, Clock, CheckCircle, XCircle, User, Calendar, DollarSign } from 'lucide-react';
import PageHeader from '../../components/customerPanel/common/PageHeader';
import PropertyCard from '../../components/customerPanel/profile/ProfileCard';
import InvoicePreview from '../../components/customerPanel/transactions/InvoicePreview';
import AgreementPreview from '../../components/customerPanel/transactions/AgreementPreview';

// Mock data
const mockTransactions = [
  {
    id: '1',
    type: 'Purchase',
    status: 'Completed',
    amount: 450000,
    property: {
      id: '101',
      title: 'Modern Apartment in Downtown',
      description: 'A beautiful modern apartment in the heart of downtown',
      type: 'Apartment',
      status: 'Sold',
      price: 450000,
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      location: 'Downtown',
      city: 'New York',
      state: 'NY',
      images: ['https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'],
      features: ['Parking', 'Gym', 'Pool'],
      ownerId: '2',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-02-15T00:00:00.000Z',
    },
    buyer: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    seller: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 234 567 891',
      address: '456 Oak St',
      city: 'New York',
      state: 'NY',
      zip: '10002',
      country: 'USA',
      createdAt: '2022-01-01T00:00:00.000Z',
    },
    date: '2023-02-15T00:00:00.000Z',
    documents: {
      invoice: 'invoice_1.pdf',
      agreement: 'agreement_1.pdf',
    },
  },
  {
    id: '2',
    type: 'Rent',
    status: 'Pending',
    amount: 2500,
    property: {
      id: '102',
      title: 'Luxury Villa with Pool',
      description: 'Spacious luxury villa with a private pool',
      type: 'Villa',
      status: 'Rented',
      price: 2500,
      bedrooms: 4,
      bathrooms: 3,
      area: 3000,
      location: 'Suburbs',
      city: 'Los Angeles',
      state: 'CA',
      images: ['https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'],
      features: ['Pool', 'Garden', 'Garage'],
      ownerId: '3',
      createdAt: '2023-02-01T00:00:00.000Z',
      updatedAt: '2023-03-01T00:00:00.000Z',
    },
    buyer: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    seller: {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+1 234 567 892',
      address: '789 Pine St',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'USA',
      createdAt: '2022-02-01T00:00:00.000Z',
    },
    date: '2023-03-01T00:00:00.000Z',
    documents: {
      agreement: 'agreement_2.pdf',
    },
  },
];

const mockInvoice = {
  id: '1',
  transactionId: '1',
  invoiceNumber: 'INV-2023-001',
  date: '2023-02-15T00:00:00.000Z',
  amount: 450000,
  items: [
    {
      description: 'Modern Apartment in Downtown',
      amount: 450000,
    },
  ],
  taxes: [
    {
      description: 'Property Transfer Tax',
      percentage: 2,
      amount: 9000,
    },
  ],
  totalAmount: 459000,
  paidAmount: 459000,
  dueAmount: 0,
  dueDate: '2023-03-15T00:00:00.000Z',
};

const mockAgreement = {
  id: '1',
  transactionId: '1',
  agreementNumber: 'AGR-2023-001',
  date: '2023-02-15T00:00:00.000Z',
  parties: {
    buyer: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    seller: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 234 567 891',
      address: '456 Oak St',
      city: 'New York',
      state: 'NY',
      zip: '10002',
      country: 'USA',
      createdAt: '2022-01-01T00:00:00.000Z',
    },
  },
  property: {
    id: '101',
    title: 'Modern Apartment in Downtown',
    description: 'A beautiful modern apartment in the heart of downtown',
    type: 'Apartment',
    status: 'Sold',
    price: 450000,
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    location: 'Downtown',
    city: 'New York',
    state: 'NY',
    images: ['https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750'],
    features: ['Parking', 'Gym', 'Pool'],
    ownerId: '2',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-02-15T00:00:00.000Z',
  },
  terms: [
    'The buyer agrees to purchase the property from the seller for the amount specified.',
    'The buyer shall pay the full amount on the closing date.',
    'The seller guarantees that the property is free from all encumbrances.',
    'The buyer has inspected the property and accepts it in its current condition.',
    'This agreement is binding upon both parties once signed.',
  ],
  signatures: {
    buyer: 'John Doe',
    seller: 'Jane Smith',
  },
};

const TransactionDetailPage = () => {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  // In a real app, you would fetch the transaction, invoice, and agreement from an API
  useEffect(() => {
    const foundTransaction = mockTransactions.find(t => t.id === id);
    if (foundTransaction) {
      setTransaction(foundTransaction);
      // In a real app, you would fetch these based on the transaction ID
      if (foundTransaction.documents.invoice) {
        setInvoice(mockInvoice);
      }
      if (foundTransaction.documents.agreement) {
        setAgreement(mockAgreement);
      }
    }
  }, [id]);

  if (!transaction) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading transaction details...</p>
      </div>
    );
  }

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
    switch (transaction.status) {
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
    switch (transaction.status) {
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
    switch (transaction.type) {
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
          <Link to="/transactions" className="flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Transactions
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap gap-4 mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeClass()}`}>
          {transaction.type}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusClass()}`}>
          {getStatusIcon()}
          <span className="ml-1">{transaction.status}</span>
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
                        <span className="font-medium">{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Type</span>
                      <span className="font-medium">{transaction.type}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Status</span>
                      <div className="flex items-center">
                        {getStatusIcon()}
                        <span className="font-medium ml-2">{transaction.status}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Amount</span>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-xl">{formatCurrency(transaction.amount)}</span>
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
                      <p className="font-medium">{transaction.buyer.name}</p>
                      <p className="text-sm text-gray-500">{transaction.buyer.email}</p>
                      <p className="text-sm text-gray-500">{transaction.buyer.phone}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {transaction.buyer.address}, {transaction.buyer.city}, {transaction.buyer.state} {transaction.buyer.zip}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Seller
                    </h4>
                    <div>
                      <p className="font-medium">{transaction.seller.name}</p>
                      <p className="text-sm text-gray-500">{transaction.seller.email}</p>
                      <p className="text-sm text-gray-500">{transaction.seller.phone}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {transaction.seller.address}, {transaction.seller.city}, {transaction.seller.state} {transaction.seller.zip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                <div className="flex flex-wrap gap-4">
                  {transaction.documents.invoice && (
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
                  {transaction.documents.agreement && (
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
            <PropertyCard property={transaction.property} isCompact />
          </div>
        </div>
      )}

      {activeTab === 'invoice' && invoice && <InvoicePreview invoice={invoice} transaction={transaction} />}
      {activeTab === 'agreement' && agreement && <AgreementPreview agreement={agreement} />}
    </div>
  );
};

export default TransactionDetailPage;