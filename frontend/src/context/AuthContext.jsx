import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { Backendurl } from "../App";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to set token with expiration
  const setTokenWithExpiry = (token) => {
    if (!token) {
      console.error('No token provided to setTokenWithExpiry');
      return;
    }

    try {
      const expiresIn = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const expiryTime = new Date().getTime() + expiresIn;
      
      localStorage.setItem("token", token);
      localStorage.setItem("tokenExpiry", expiryTime.toString());
      
      // Set axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log('Token set successfully:', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  };

  // Function to check if token is expired
  const isTokenExpired = () => {
    const token = localStorage.getItem("token");
    const expiryTime = localStorage.getItem("tokenExpiry");
    
    if (!token || !expiryTime) return true;
    
    const now = new Date().getTime();
    const isExpired = now > parseInt(expiryTime);
    console.log('Token expiry check:', { now, expiryTime, isExpired });
    return isExpired;
  };

  // Function to clear token
  const clearToken = () => {
    console.log('Clearing token');
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    delete axios.defaults.headers.common["Authorization"];
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log('Initializing auth with token:', token);
        
        if (token && !isTokenExpired()) {
          // Set axios header before making any requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          console.log('Set axios header:', axios.defaults.headers.common["Authorization"]);
          
          try {
            console.log('Making /api/auth/me request...');
            const response = await axios.get(`${Backendurl}/api/auth/me`);
            console.log('User data response:', response.data);
            
            if (response.data) {
              setUser(response.data);
              setIsLoggedIn(true);
            }
          } catch (error) {
            console.error("Error fetching user data:", {
              status: error.response?.status,
              data: error.response?.data,
              headers: error.response?.headers,
              config: {
                url: error.config?.url,
                headers: error.config?.headers
              }
            });
            clearToken();
            setUser(null);
            setIsLoggedIn(false);
          }
        } else {
          console.log('No valid token found or token expired');
          clearToken();
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearToken();
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Login attempt with:', { email });
      const response = await axios.post(`${Backendurl}/api/auth/login`, {
        email,
        password
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data.data;
        console.log('Login successful, token received:', token);
        
        // Set token and user data
        setTokenWithExpiry(token);
        setUser(user);
        setIsLoggedIn(true);
        
        return { success: true };
      } else {
        console.log('Login failed:', response.data.message);
        return {
          success: false,
          message: response.data.message || "Login failed"
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed"
      };
    }
  };

  const logout = () => {
    clearToken();
    setIsLoggedIn(false);
    setUser(null);
    toast.success("Logged out successfully");
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loading, login, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

