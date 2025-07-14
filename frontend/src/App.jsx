import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { HelmetProvider } from "react-helmet-async";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetails from "./components/properties/propertydetail";
import PropertyListingForm from "./components/properties/PropertyListingForm";
import Aboutus from "./pages/About";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Login from "./components/login";
import Signup from "./components/signup";
import ForgotPassword from "./components/forgetpassword";
import ResetPassword from "./components/resetpassword";
import Footer from "./components/footer";
import NotFoundPage from "./components/Notfound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AIPropertyHub from "./pages/Aiagent";
import StructuredData from "./components/SEO/StructuredData";
import AdminDashboard from "./components/admin/Dashboard";
import Users from "./components/admin/Users";
import CustomerPanel from "./components/customerPanel/CustomerPanel";
import FeaturesDetail from "./pages/FeaturesDetail";
import ScrollToTop from "./components/ScrollToTop";
import RoomAvailabilityRequestsPage from "./pages/admin/RoomAvailabilityRequests.jsx";
import SceneViewer from "./pages/SceneViewer";
import AuthCallback from "./pages/AuthCallback";
import GoogleOAuthProviderWrapper from "./components/GoogleOAuthProvider";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";

export const Backendurl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Suppress Cross-Origin-Opener-Policy warnings for Google OAuth
const originalError = console.error;
console.error = (...args) => {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    args[0].includes("Cross-Origin-Opener-Policy")
  ) {
    return; // Suppress these specific warnings
  }
  originalError.apply(console, args);
};

const AppContent = () => {
  const location = useLocation();
  const isCustomerPanel = location.pathname.startsWith("/customer-panel");
  const isSceneViewer = location.pathname.startsWith("/scene-viewer");

  return (
    <>
      <StructuredData type="website" />
      <StructuredData type="organization" />

      {!isSceneViewer && <Navbar />}
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/list-property" element={<PropertyListingForm />} />
        <Route
          path="/properties/single/:id"
          element={
            <ProtectedRoute>
              <PropertyDetails />
            </ProtectedRoute>
          }
        />
        <Route path="/scene-viewer/:sceneId" element={<SceneViewer />} />
        <Route path="/about" element={<Aboutus />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/ai-property-hub" element={<AIPropertyHub />} />
        <Route path="/features" element={<FeaturesDetail />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />

        <Route path="/customer-panel/*" element={<CustomerPanel />} />

        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<div>Admin Dashboard</div>} />
          <Route path="users" element={<Users />} />
          <Route path="properties" element={<div>Properties Management</div>} />
          <Route
            path="room-availability-requests"
            element={<RoomAvailabilityRequestsPage />}
          />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {!isSceneViewer && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <GoogleOAuthProviderWrapper>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <AppContent />
          </Router>
          <ToastContainer />
        </AuthProvider>
      </GoogleOAuthProviderWrapper>
    </HelmetProvider>
  );
};

export default App;
