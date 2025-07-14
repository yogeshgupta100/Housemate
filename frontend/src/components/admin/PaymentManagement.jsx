import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Loader,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { Backendurl } from "../../App.jsx";

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    payment_method: "",
    page: 1,
    limit: 20,
  });
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [cashPaymentData, setCashPaymentData] = useState({
    transactionId: "",
    amount: "",
    notes: "",
  });
  const [refundData, setRefundData] = useState({
    amount: "",
    reason: "",
  });
  const [transferData, setTransferData] = useState({
    amount: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filters]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(
        `${Backendurl}/api/payments/all-payments?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPayments(data.data.payments);
        setStats(data.data.stats);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Fetch payments error:", error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${Backendurl}/api/payments/all-payments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  const handleAddCashPayment = async () => {
    try {
      const response = await fetch(`${Backendurl}/api/payments/cash-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cashPaymentData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Cash payment added successfully");
        setShowCashPaymentModal(false);
        setCashPaymentData({ transactionId: "", amount: "", notes: "" });
        fetchPayments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Add cash payment error:", error);
      toast.error(error.message || "Failed to add cash payment");
    }
  };

  const handleRefundPayment = async () => {
    try {
      const response = await fetch(`${Backendurl}/api/payments/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          amount: refundData.amount,
          reason: refundData.reason,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Payment refunded successfully");
        setShowRefundModal(false);
        setRefundData({ amount: "", reason: "" });
        setSelectedPayment(null);
        fetchPayments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Refund payment error:", error);
      toast.error(error.message || "Failed to refund payment");
    }
  };

  const handleTransferToOwner = async () => {
    try {
      const response = await fetch(
        `${Backendurl}/api/payments/transfer-to-owner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            paymentId: selectedPayment.id,
            amount: transferData.amount,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Transfer to owner initiated successfully");
        setShowTransferModal(false);
        setTransferData({ amount: "" });
        setSelectedPayment(null);
        fetchPayments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Transfer to owner error:", error);
      toast.error(error.message || "Failed to transfer to owner");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "razorpay":
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case "cash":
        return <DollarSign className="w-5 h-5 text-green-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Management
        </h1>
        <p className="text-gray-600">Manage all payments and transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Payments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_payments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed_payments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending_payments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_amount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCashPaymentModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Add Cash Payment
              </button>
              <button
                onClick={fetchPayments}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value, page: 1 })
                }
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={filters.payment_method}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    payment_method: e.target.value,
                    page: 1,
                  })
                }
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Methods</option>
                <option value="razorpay">Razorpay</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <Loader className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{payment.id}
                      </div>
                      {payment.razorpay_payment_id && (
                        <div className="text-sm text-gray-500">
                          {payment.razorpay_payment_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.first_name} {payment.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.property_title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {payment.payment_method}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(payment.payment_status)}
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(
                            payment.payment_status
                          )}`}
                        >
                          {payment.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {payment.payment_status === "completed" &&
                          payment.payment_method === "razorpay" && (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setTransferData({
                                  amount:
                                    payment.split_details?.base_amount ||
                                    payment.amount * 0.98,
                                });
                                setShowTransferModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Transfer to Owner
                            </button>
                          )}
                        {payment.payment_method === "razorpay" &&
                          payment.payment_status === "completed" && (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setRefundData({ amount: "", reason: "" });
                                setShowRefundModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Refund
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Payment Modal */}
      {showCashPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Cash Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID
                </label>
                <input
                  type="number"
                  value={cashPaymentData.transactionId}
                  onChange={(e) =>
                    setCashPaymentData({
                      ...cashPaymentData,
                      transactionId: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter transaction ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={cashPaymentData.amount}
                  onChange={(e) =>
                    setCashPaymentData({
                      ...cashPaymentData,
                      amount: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={cashPaymentData.notes}
                  onChange={(e) =>
                    setCashPaymentData({
                      ...cashPaymentData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Optional notes"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCashPaymentModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCashPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Refund Payment</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Payment ID: {selectedPayment.razorpay_payment_id}
              </p>
              <p className="text-sm text-gray-600">
                Amount: {formatCurrency(selectedPayment.amount)}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount
                </label>
                <input
                  type="number"
                  value={refundData.amount}
                  onChange={(e) =>
                    setRefundData({ ...refundData, amount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={`Max: ${selectedPayment.amount}`}
                  max={selectedPayment.amount}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={refundData.reason}
                  onChange={(e) =>
                    setRefundData({ ...refundData, reason: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Reason for refund"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundPayment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Transfer to Owner</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Payment ID: {selectedPayment.id}
              </p>
              <p className="text-sm text-gray-600">
                Total Amount: {formatCurrency(selectedPayment.amount)}
              </p>
              {selectedPayment.split_details && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    Base Amount:{" "}
                    {formatCurrency(selectedPayment.split_details.base_amount)}
                  </p>
                  <p className="text-sm text-blue-800">
                    Commission:{" "}
                    {formatCurrency(
                      selectedPayment.split_details.commission_amount
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Amount
                </label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) =>
                    setTransferData({ ...transferData, amount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Amount to transfer to owner"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferToOwner}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Transfer to Owner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
