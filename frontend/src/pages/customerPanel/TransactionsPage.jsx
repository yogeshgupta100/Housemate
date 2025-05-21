import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FileText, Download } from 'lucide-react';
import PageHeader from '../../components/customerPanel/common/PageHeader';
import TransactionCard from '../../components/customerPanel/transactions/TransactionCard';

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

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || transaction.type === filterType;
    const matchesStatus = !filterStatus || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div>
      <PageHeader 
        title="Transactions" 
        description="View and manage your property transactions"
      />
      
      <div className="mt-6 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Types</option>
              <option value="Purchase">Purchase</option>
              <option value="Sale">Sale</option>
              <option value="Rent">Rent</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-500">
            There are no transactions matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTransactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;