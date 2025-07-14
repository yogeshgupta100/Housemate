import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Search,
  Filter,
  Users as UsersIcon,
  Loader,
  Mail,
  Phone,
  Building,
  AlertCircle,
  Eye,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { backendurl } from "../App";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProperties, setUserProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    user_type: "",
    is_verified: false,
    password: "123456",
  });

  const searchTimeout = useRef(null);

  const handleSearch = (searchValue) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchTerm(searchValue);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${backendurl}/api/auth/get-all-roles`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.data.success) {
        setRoles(response.data.data.map((role) => role.name || role));
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error(error.response?.data?.message || "Failed to fetch roles");
    }
  };

  const fetchUsers = async (page = currentPage, limit = itemsPerPage) => {
    try {
      if (!searchTerm) {
        setLoading(true);
      }
      const params = new URLSearchParams({
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== "all" && { userType: filterType }),
        ...(verificationFilter !== "all" && {
          verificationStatus: verificationFilter,
        }),
      });

      const response = await axios.get(
        `${backendurl}/api/admin/users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await axios.put(
        `${backendurl}/api/admin/users/${userId}`,
        { user_type: newRole },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        toast.success("Role updated successfully");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleVerificationToggle = async (userId, isVerified) => {
    try {
      const response = await axios.put(
        `${backendurl}/api/admin/users/${userId}/verify`,
        {
          is_verified: !isVerified,
          verification_status: !isVerified ? "verified" : "pending",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        toast.success(
          `User ${isVerified ? "unverified" : "verified"} successfully`
        );
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update verification status"
      );
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${backendurl}/api/auth/register`,
        newUser,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        toast.success(
          "User created successfully with temporary password '123456'"
        );
        setShowCreateUserModal(false);
        setNewUser({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          user_type: "",
          is_verified: false,
          password: "123456",
        });
        fetchUsers();
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleViewUserDetails = (user) => {
    navigate(`/users/${user.id}`);
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [currentPage, itemsPerPage, searchTerm, filterType, verificationFilter]);

  const handleDeleteUser = async (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${backendurl}/api/admin/users/${userToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setShowConfirmDialog(false);
      setUserToDelete(null);
    }
  };

  const handlePageChange = (page, newItemsPerPage) => {
    if (newItemsPerPage !== itemsPerPage) {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1);
    } else {
      setCurrentPage(page);
    }
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      [user.first_name, user.last_name, user.email, user.user_type].some(
        (field) => field.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesType = filterType === "all" || user.user_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              User Management
            </h1>
            <p className="text-gray-600">{filteredUsers.length} Users Found</p>
          </div>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UsersIcon className="w-5 h-5" />
            Create New User
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Users</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <select
                          value={user.user_type}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 capitalize"
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_verified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.is_verified ? "Verified" : "Pending"}
                        </span>
                        <button
                          onClick={() =>
                            handleVerificationToggle(user.id, user.is_verified)
                          }
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            user.is_verified
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                          title={
                            user.is_verified ? "Unverify User" : "Verify User"
                          }
                        >
                          {user.is_verified ? "Unverify" : "Verify"}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewUserDetails(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteUser(
                              user.id,
                              `${user.first_name} ${user.last_name}`
                            )
                          }
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={confirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete user "${userToDelete?.name}"? This action cannot be undone.`}
          type="danger"
        />

        {!loading && users.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  );
};

export default Users;
