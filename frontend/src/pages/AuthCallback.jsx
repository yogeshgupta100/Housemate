import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { Loader } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the access token from URL params
        const accessToken = searchParams.get("access_token");
        const error = searchParams.get("error");

        if (error) {
          console.error("OAuth error:", error);
          toast.error("Authentication failed. Please try again.");
          navigate("/login");
          return;
        }

        if (!accessToken) {
          console.error("No access token received");
          toast.error("Authentication failed. No access token received.");
          navigate("/login");
          return;
        }

        // Process the Google authentication
        // This will be handled by the GoogleSignInButton component
        // For now, redirect to login page where the OAuth flow will complete
        navigate("/login", {
          state: {
            from: { pathname: "/properties" },
            googleAuth: true,
            accessToken,
          },
        });
      } catch (error) {
        console.error("Auth callback error:", error);
        toast.error("Authentication failed. Please try again.");
        navigate("/login");
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Authentication...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your sign-in.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
