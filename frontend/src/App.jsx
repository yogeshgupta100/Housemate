import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Properties from './pages/Properties'
import PropertyDetails from './components/properties/propertydetail';
import PropertyListingForm from './components/properties/PropertyListingForm';
import Aboutus from './pages/About'
import Contact from './pages/Contact'
import Login from './components/login';
import Signup from './components/signup';
import ForgotPassword from './components/forgetpassword';
import ResetPassword from './components/resetpassword';
import Footer from './components/footer';
import NotFoundPage from './components/Notfound';
import { AuthProvider } from './context/AuthContext';
import AIPropertyHub from './pages/Aiagent'
import StructuredData from './components/SEO/StructuredData';
import AdminDashboard from './components/admin/Dashboard';
import Users from './components/admin/Users';
import CustomerPanel from './components/customerPanel/CustomerPanel';
import FeaturesDetail from './pages/FeaturesDetail';
import ScrollToTop from './components/ScrollToTop';

export const Backendurl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const AppContent = () => {
  const location = useLocation();
  const isCustomerPanel = location.pathname.startsWith('/customer-panel');

  return (
    <>
      <StructuredData type="website" />
      <StructuredData type="organization" />
      
      <Navbar />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/list-property" element={<PropertyListingForm />} />
        <Route path="/properties/single/:id" element={<PropertyDetails />} />
        <Route path="/about" element={<Aboutus />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/ai-property-hub" element={<AIPropertyHub />} />
        <Route path="/features" element={<FeaturesDetail />} />
        
        <Route path="/customer-panel/*" element={<CustomerPanel />} />
        
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<div>Admin Dashboard</div>} />
          <Route path="users" element={<Users />} />
          <Route path="properties" element={<div>Properties Management</div>} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
        <ToastContainer />
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;