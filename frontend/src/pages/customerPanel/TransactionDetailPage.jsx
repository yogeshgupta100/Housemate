import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";
import PageHeader from "../../components/customerPanel/common/PageHeader";
import PropertyCard from "../../components/customerPanel/profile/ProfileCard";
import InvoicePreview from "../../components/customerPanel/transactions/InvoicePreview";
import AgreementPreview from "../../components/customerPanel/transactions/AgreementPreview";
import { useAuth } from "../../context/AuthContext.jsx";
import { Backendurl } from "../../App.jsx";
import { toast } from "react-toastify";
const TransactionDetailPage = () => {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token = user?.token || localStorage.getItem("token");
        const res = await fetch(`${Backendurl}/api/transactions/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.transaction) {
          setTransaction(data.transaction);

          // Invoice data from transaction
          const invoiceData = {
            invoiceNumber: `INV-${data.transaction.id}`,
            date: data.transaction.created_at,
            dueDate: data.transaction.move_in_date,
            items: [
              {
                description: `Rent for Room ${data.transaction.room_number} at ${data.transaction.property_title}`,
                amount: Number(data.transaction.rent_amount),
              },
              {
                description: `Security Deposit`,
                amount: Number(data.transaction.deposit_amount),
              },
            ],
            taxes: [
              {
                description: "GST",
                percentage: 18,
                amount:
                  (Number(data.transaction.rent_amount) +
                    Number(data.transaction.deposit_amount)) *
                  0.18,
              },
            ],
            amount:
              Number(data.transaction.rent_amount) +
              Number(data.transaction.deposit_amount),
            totalAmount:
              (Number(data.transaction.rent_amount) +
                Number(data.transaction.deposit_amount)) *
              1.18,
            paidAmount: Number(data.transaction.payment_amount),
            dueAmount:
              (Number(data.transaction.rent_amount) +
                Number(data.transaction.deposit_amount)) *
                1.18 -
              Number(data.transaction.payment_amount),
            tenant: `${user?.data?.first_name || data.transaction.first_name} ${
              user?.data?.last_name || data.transaction.last_name
            }`,
            tenantEmail: user?.data?.email || data.transaction.email,
            propertyTitle: data.transaction.property_title,
            moveInDate: data.transaction.move_in_date,
            leasePeriod: data.transaction.lease_period,
            seller: {
              name:
                `${data.transaction.owner_first_name || "N/A"} ${
                  data.transaction.owner_last_name || ""
                }`.trim() || "N/A",
              email: data.transaction.owner_email || "N/A",
              phone: data.transaction.owner_phone || "N/A",
            },
            buyer: {
              name:
                `${
                  user?.data?.first_name || data.transaction.first_name || "N/A"
                } ${
                  user?.data?.last_name || data.transaction.last_name || ""
                }`.trim() || "N/A",
              email: user?.data?.email || data.transaction.email || "N/A",
              phone: user?.data?.phone || "N/A",
            },
          };
          setInvoice(invoiceData);

          // Agreement data from transaction
          const agreementData = {
            agreementNumber: `AGR-${data.transaction.id}`,
            date: data.transaction.created_at,
            parties: {
              seller: {
                name:
                  `${data.transaction.owner_first_name || "N/A"} ${
                    data.transaction.owner_last_name || ""
                  }`.trim() || "N/A",
                email: data.transaction.owner_email || "N/A",
                phone: data.transaction.owner_phone || "N/A",
              },
              buyer: {
                name:
                  `${
                    user?.data?.first_name ||
                    data.transaction.first_name ||
                    "N/A"
                  } ${
                    user?.data?.last_name || data.transaction.last_name || ""
                  }`.trim() || "N/A",
                email: user?.data?.email || data.transaction.email || "N/A",
                phone: user?.data?.phone || "N/A",
              },
            },
            property: {
              title: data.transaction.property_title,
              roomNumber: data.transaction.room_number,
            },
            leasePeriod: data.transaction.lease_period,
            moveInDate: data.transaction.move_in_date,
            rentAmount: data.transaction.rent_amount,
            depositAmount: data.transaction.deposit_amount,
            terms: [
              "The property will be delivered in the same condition as shown during the inspection.",
              "All necessary documents and clearances will be provided by the seller.",
              "The buyer agrees to complete all payments as per the agreed schedule.",
              "The seller warrants that the property is free from any legal encumbrances.",
              "Both parties agree to complete the registration process within 30 days of this agreement.",
            ],
          };
          setAgreement(agreementData);
        } else {
          toast.error("Transaction not found");
          setTransaction(null);
        }
      } catch (err) {
        toast.error("Fetch error");
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        Loading transaction details...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex justify-center items-center h-full">
        Transaction not found.
      </div>
    );
  }

  const property = {
    ...transaction?.property,
    images: Array.isArray(transaction?.property?.images)
      ? transaction?.property?.images
      : transaction?.property_images || [],
  };
  const amount =
    transaction?.amount || Number(transaction?.property_price) || 0;
  const status = transaction?.status || "Pending";
  const type = transaction?.type || "Rent";
  const date = transaction?.created_at || transaction?.date;
  const documents = transaction.documents || {};
  // const seller = transaction.seller || {};

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "Cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case "Purchase":
        return "bg-blue-100 text-blue-800";
      case "Sale":
        return "bg-purple-100 text-purple-800";
      case "Rent":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCompleteTransaction = async () => {
    if (
      !confirm(
        "Are you sure you want to proceed with payment for this transaction?"
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const token = user?.token || localStorage.getItem("token");
      const response = await fetch(
        `${Backendurl}/api/transactions/complete/${transaction.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Redirecting to payment gateway...");

        // Redirect to payment gateway with transaction details
        navigate(`/payment/${data.paymentDetails.transactionId}`, {
          state: {
            transactionId: data.paymentDetails.transactionId,
            amount: data.paymentDetails.amount,
            baseAmount: data.paymentDetails.baseAmount,
            adminCommission: data.paymentDetails.adminCommission,
            razorpayFee: data.paymentDetails.razorpayFee,
            subtotalWithFees: data.paymentDetails.subtotalWithFees,
            gst: data.paymentDetails.gst,
            propertyTitle: data.paymentDetails.propertyTitle,
            roomDetails: {
              roomNumber: data.paymentDetails.roomNumber,
              rent: data.paymentDetails.rentAmount,
              deposit: data.paymentDetails.depositAmount,
            },
          },
        });
      } else {
        toast.error(data.message || "Failed to proceed with payment");
      }
    } catch (error) {
      console.error("Error preparing payment:", error);
      toast.error("Failed to proceed with payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this transaction? This action cannot be undone."
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const token = user?.token || localStorage.getItem("token");
      const response = await fetch(
        `${Backendurl}/api/transactions/cancel/${transaction.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Transaction cancelled successfully!");
        // Refresh transaction data
        window.location.reload();
      } else {
        toast.error(data.message || "Failed to cancel transaction");
      }
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      toast.error("Failed to cancel transaction");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transaction Details"
        description={`Details for transaction #${transaction.id}`}
        backLink={
          <Link
            to="/customer-panel/transactions"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Transactions
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap gap-4 mb-6">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeClass()}`}
        >
          {type}
        </span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusClass()}`}
        >
          {getStatusIcon()}
          <span className="ml-1">{status}</span>
        </span>
      </div>

      {/* Action Buttons for Pending Transactions */}
      {transaction.status === "pending" && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            Transaction Actions
          </h3>
          <p className="text-yellow-700 mb-4">
            This transaction is currently pending. You can proceed to payment to
            complete the rental or cancel it to remove the transaction entirely.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleCompleteTransaction}
              disabled={actionLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Proceed to Payment
            </button>
            <button
              onClick={handleCancelTransaction}
              disabled={actionLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Cancel Transaction
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "details"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          {invoice && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "invoice"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("invoice")}
            >
              Invoice
            </button>
          )}
          {agreement && (
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "agreement"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("agreement")}
            >
              Agreement
            </button>
          )}
        </div>
      </div>

      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Transaction Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Transaction ID
                      </span>
                      <span className="font-medium">{transaction.id}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Property Title
                      </span>
                      <span className="font-medium">
                        {transaction.property_title}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Room Number
                      </span>
                      <span className="font-medium">
                        {transaction.room_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Tenant Name
                      </span>
                      <span className="font-medium">
                        {transaction.first_name} {transaction.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Tenant Email
                      </span>
                      <span className="font-medium">{transaction.email}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Move-in Date
                      </span>
                      <span className="font-medium">
                        {formatDate(transaction.move_in_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Lease Period
                      </span>
                      <span className="font-medium">
                        {transaction.lease_period}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Rent Amount
                      </span>
                      <span className="font-medium">
                        {formatCurrency(Number(transaction.rent_amount))}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Deposit Amount
                      </span>
                      <span className="font-medium">
                        {formatCurrency(Number(transaction.deposit_amount))}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Payment Status
                      </span>
                      <span className="font-medium">
                        {transaction.payment_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Payment Amount
                      </span>
                      <span className="font-medium">
                        {formatCurrency(Number(transaction.payment_amount))}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Status
                      </span>
                      <span className="font-medium">{transaction.status}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        Created At
                      </span>
                      <span className="font-medium">
                        {formatDate(transaction.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Parties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Buyer
                    </h4>
                    <div>
                      <p className="font-medium">
                        {transaction?.first_name} {transaction?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction?.email}
                      </p>
                      {/* <p className="text-sm text-gray-500">{user?.data?.phone}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {transaction.buyer?.address}, {transaction.buyer?.city}, {transaction.buyer?.state} {transaction.buyer?.zip}
                      </p> */}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Seller
                    </h4>
                    <div>
                      <p className="font-medium">
                        {transaction?.owner_first_name}{" "}
                        {transaction?.owner_last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction?.owner_email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                <div className="flex flex-wrap gap-4">
                  {documents.invoice && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("invoice");
                      }}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View Invoice
                    </a>
                  )}
                  {documents.agreement && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("agreement");
                      }}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View Agreement
                    </a>
                  )}
                </div>
              </div>
            </div> */}
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Property Information</h3>
            <PropertyCard property={property} isCompact />
          </div>
        </div>
      )}

      {activeTab === "invoice" && invoice && (
        <InvoicePreview invoice={invoice} />
      )}
      {activeTab === "agreement" && agreement && (
        <AgreementPreview agreement={agreement} />
      )}
    </div>
  );
};

export default TransactionDetailPage;
