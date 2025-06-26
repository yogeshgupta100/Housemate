import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { Backendurl } from "../App";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setTokenWithExpiry = (token) => {
    if (!token) {
      console.error('No token provided to setTokenWithExpiry');
      return;
    }

    try {
      const expiresIn = 24 * 60 * 60 * 1000; 
      const expiryTime = new Date().getTime() + expiresIn;
      
      localStorage.setItem("token", token);
      localStorage.setItem("tokenExpiry", expiryTime.toString());
      
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log('Token set successfully:', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  };

  const isTokenExpired = () => {
    const token = localStorage.getItem("token");
    const expiryTime = localStorage.getItem("tokenExpiry");
    
    if (!token || !expiryTime) return true;
    
    const now = new Date().getTime();
    const isExpired = now > parseInt(expiryTime);
    console.log('Token expiry check:', { now, expiryTime, isExpired });
    return isExpired;
  };

  const clearToken = () => {
    console.log('Clearing token');
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    delete axios.defaults.headers.common["Authorization"];
  };

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${Backendurl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data) {
        setUser(response.data);
        setIsLoggedIn(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log('Initializing auth with token:', token);
        
        if (token && !isTokenExpired()) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          await fetchUserData(token);
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

  const login = async (identifier, password, token = null) => {
    try {
      if (token) {
        // Google authentication - token is already provided
        console.log('Google login with token:', token);
        setTokenWithExpiry(token);
        const userDataFetched = await fetchUserData(token);
        
        if (userDataFetched) {
          return { success: true };
        } else {
          clearToken();
          return {
            success: false,
            message: "Failed to fetch user data"
          };
        }
      }

      // Regular email/password authentication
      console.log('Login attempt with:', { identifier });
      const response = await axios.post(`${Backendurl}/api/auth/login`, {
        identifier,
        password
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        const { token: responseToken, user } = response.data.data;
        console.log('Login successful, token received:', responseToken);
        
        setTokenWithExpiry(responseToken);
        const userDataFetched = await fetchUserData(responseToken);
        
        if (userDataFetched) {
          return { success: true };
        } else {
          clearToken();
          return {
            success: false,
            message: "Failed to fetch user data"
          };
        }
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

