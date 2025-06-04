import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, Filter, FileText, Download } from 'lucide-react';
import PageHeader from '../../components/customerPanel/common/PageHeader';
import TransactionCard from '../../components/customerPanel/transactions/TransactionCard';
import { Backendurl } from '../../App.jsx';
import { useAuth } from '../../context/AuthContext';
const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { user} = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      console.log({user});
      try {
        const res = await axios.get(`${Backendurl}/api/transactions/user/${user?.data?.id}`);
        if (res.data.success) {
          setTransactions(res.data.transactions);
        }
      } catch (err) {
        setTransactions([]);
      }
    };
    fetchTransactions();
  }, []);


  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.location?.toLowerCase().includes(searchTerm.toLowerCase());
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