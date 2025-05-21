import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProfilePage from '../../pages/customerPanel/ProfilePage';
import TransactionsPage from '../../pages/customerPanel/TransactionsPage';
import ListedPropertiesPage from '../../pages/customerPanel/ListedPropertiesPage';
import TransactionDetailPage from '../../pages/customerPanel/TransactionDetailPage';
import PropertyDetailPage from '../../pages/customerPanel/PropertyDetailPage';

const CustomerPanel = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 mt-16">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8">
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:id" element={<TransactionDetailPage />} />
          <Route path="/properties" element={<ListedPropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default CustomerPanel;