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
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { backendurl } from "../App";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
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
            });

            const response = await axios.get(`${backendurl}/api/admin/users?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

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
                { is_verified: !isVerified },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (response.data.success) {
                toast.success(`User ${isVerified ? "unverified" : "verified"} successfully`);
                fetchUsers();
            }
        } catch (error) {
            console.error("Error updating verification status:", error);
            toast.error(error.response?.data?.message || "Failed to update verification status");
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
                toast.success("User created successfully with temporary password '123456'");
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

    useEffect(() => {
        fetchRoles();
        fetchUsers();
    }, [currentPage, itemsPerPage, searchTerm, filterType]);

    const handleDeleteUser = async (userId, userName) => {
        setUserToDelete({ id: userId, name: userName });
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await axios.delete(`${backendurl}/api/admin/users/${userToDelete.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

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

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            !searchTerm ||
            [user.first_name, user.last_name, user.email, user.user_type].some((field) =>
                field.toLowerCase().includes(searchTerm.toLowerCase())
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
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
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

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search users..."
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-400 w-4 h-4" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Types</option>
                                {roles.map((role) => (
                                    <option key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Create User Modal */}
                {showCreateUserModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
                            <form onSubmit={handleCreateUser}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        type="text"
                                        value={newUser.first_name}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, first_name: e.target.value })
                                        }
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        type="text"
                                        value={newUser.last_name}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, last_name: e.target.value })
                                        }
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, email: e.target.value })
                                        }
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="text"
                                        value={newUser.phone}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, phone: e.target.value })
                                        }
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        value={newUser.user_type}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, user_type: e.target.value })
                                        }
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map((role) => (
                                            <option key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4 flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={newUser.is_verified}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, is_verified: e.target.checked })
                                        }
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 text-sm text-gray-700">Verified</label>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateUserModal(false)}
                                        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Verified
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            <AnimatePresence>
                                {filteredUsers?.map((user) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                                                    {user.first_name[0]}
                                                    {user.last_name[0]}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.first_name} {user.last_name}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Phone className="w-3 h-3 mr-1" />
                                                {user.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <select
                                                    value={user.user_type}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
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
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    user.is_active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={user.is_verified || false}
                                                    onChange={() =>
                                                        handleVerificationToggle(user.id, user.is_verified)
                                                    }
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span
                                                    className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                                        user.is_verified
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {user.is_verified ? "Verified" : "Unverified"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(
                                                        user.id,
                                                        `${user.first_name} ${user.last_name}`
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                            <p className="text-gray-600">Try adjusting your search or filters</p>
                        </div>
                    )}
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