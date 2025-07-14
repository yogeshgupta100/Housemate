import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Building,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import PaymentComponent from "../components/PaymentComponent";
import { useAuth } from "../context/AuthContext";
import { Backendurl } from "../App";

const PaymentPage = () => {
  const { transactionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);

        // If we have state from navigation, use it
        if (location.state) {
          setTransaction({
            id: location.state.transactionId,
            rent_amount: location.state.roomDetails?.rent || 0,
            deposit_amount: location.state.roomDetails?.deposit || 0,
            property: {
              title: location.state.propertyTitle,
            },
            room: location.state.roomDetails,
            // Use calculated amounts from backend if available
            calculatedAmounts: {
              amount: location.state.amount,
              baseAmount: location.state.baseAmount,
              adminCommission: location.state.adminCommission,
              razorpayFee: location.state.razorpayFee,
              subtotalWithFees: location.state.subtotalWithFees,
              gst: location.state.gst,
            },
          });
          setLoading(false);
          return;
        }

        // Otherwise fetch from API
        const response = await axios.get(
          `${Backendurl}/api/transactions/${transactionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setTransaction(response.data.transaction);
        } else {
          setError("Transaction not found");
        }
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError("Failed to load transaction details");
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId, location.state]);

  const handlePaymentSuccess = () => {
    toast.success("Payment successful! Your room booking is confirmed.");
    navigate("/customer-panel/rented-properties");
  };

  const handlePaymentCancel = () => {
    toast.info("Payment cancelled. You can try again later.");
    navigate("/customer-panel/transactions");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Error
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "Transaction not found"}
            </p>
            <button
              onClick={() => navigate("/properties")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate fees and total - use backend calculations if available, otherwise calculate in frontend
  const baseAmount =
    transaction.calculatedAmounts?.baseAmount ||
    Number(transaction.rent_amount) + Number(transaction.deposit_amount);
  const adminCommission =
    transaction.calculatedAmounts?.adminCommission || baseAmount * 0.02;
  const razorpayFee =
    transaction.calculatedAmounts?.razorpayFee || baseAmount * 0.025;
  const subtotalWithFees =
    transaction.calculatedAmounts?.subtotalWithFees ||
    baseAmount + adminCommission + razorpayFee;
  const gst = transaction.calculatedAmounts?.gst || subtotalWithFees * 0.18;
  const finalTotal =
    transaction.calculatedAmounts?.amount || subtotalWithFees + gst;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-600">Secure payment for your room booking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Component */}
          <div className="lg:col-span-1">
            <PaymentComponent
              transactionId={transaction.id}
              amount={finalTotal}
              propertyTitle={transaction.property?.title}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentCancel={handlePaymentCancel}
              enableSplitPayment={true}
            />
          </div>

          {/* Transaction Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Booking Summary
              </h2>

              {/* Property Details */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Building className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">
                    {transaction.property?.title}
                  </h3>
                </div>
                {transaction.room && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>
                      Room {transaction.room.roomNumber} (Floor{" "}
                      {transaction.room.floorNumber})
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Rent:</span>
                  <span className="font-medium">
                    ₹{Number(transaction.rent_amount)?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span className="font-medium">
                    ₹{Number(transaction.deposit_amount)?.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ₹{baseAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Admin Commission (2%):</span>
                  <span className="text-gray-500">
                    ₹{adminCommission?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Processing Fee (2.5%):</span>
                  <span className="text-gray-500">
                    ₹{razorpayFee?.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal with Fees:</span>
                    <span className="font-medium">
                      ₹{subtotalWithFees?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (18%):</span>
                  <span className="text-gray-500">
                    ₹{gst?.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">
                      ₹{finalTotal?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Important Information
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Payment is processed securely through Razorpay</li>
                  <li>• Rent will be transferred to the property owner</li>
                  <li>• 2% admin commission applies for platform services</li>
                  <li>• 2.5% processing fee charged by Razorpay</li>
                  <li>• 18% GST applies on the total amount</li>
                  <li>
                    • You'll receive confirmation email after successful payment
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
