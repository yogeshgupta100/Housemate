import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ProfilePage from "../../pages/customerPanel/ProfilePage";
import TransactionsPage from "../../pages/customerPanel/TransactionsPage";
import ListedPropertiesPage from "../../pages/customerPanel/ListedPropertiesPage";
import RentedPropertiesPage from "../../pages/customerPanel/RentedPropertiesPage";
import TransactionDetailPage from "../../pages/customerPanel/TransactionDetailPage";
import Favorites from "../../pages/customerPanel/favorites/Favorites";
import FavoriteDetails from "../../pages/customerPanel/favorites/FavoriteDetails";
import { useAuth } from "../../context/AuthContext";
import NotFoundPage from "../Notfound";
import PropertyDetails from "../properties/propertydetail";
const CustomerPanel = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <NotFoundPage />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 mt-16">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8">
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/favorites/:id" element={<FavoriteDetails />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:id" element={<TransactionDetailPage />} />
          <Route path="/properties" element={<ListedPropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/rented-properties" element={<RentedPropertiesPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default CustomerPanel;
