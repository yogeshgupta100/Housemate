import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Loader,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Backendurl } from "../App.jsx";
import { useAuth } from "../context/AuthContext";

const PaymentComponent = ({
  transactionId,
  amount,
  propertyTitle,
  onPaymentSuccess,
  onPaymentCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentRecordId, setPaymentRecordId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const createPaymentOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${Backendurl}/api/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          transactionId: transactionId,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderDetails(data.data.order);
        setPaymentRecordId(data.data.payment.id);
        return data.data;
      } else {
        throw new Error(data.message || "Failed to create payment order");
      }
    } catch (error) {
      console.error("Create payment order error:", error);
      toast.error(error.message || "Failed to create payment order");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    const orderData = await createPaymentOrder();
    if (!orderData) return;

    const options = {
      key: orderData.key_id,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "Housemate",
      description: `Payment for ${propertyTitle}`,
      order_id: orderData.order.id,
      handler: async function (response) {
        await verifyPayment(response);
      },
      prefill: {
        name: user ? `${user.first_name} ${user.last_name}` : "",
        email: user ? user.email : "",
        contact: user ? user.phone : "",
      },
      notes: {
        transaction_id: transactionId,
        property_title: propertyTitle,
      },
      theme: {
        color: "#3B82F6",
      },
      modal: {
        ondismiss: function () {
          toast.info("Payment cancelled");
          if (onPaymentCancel) onPaymentCancel();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const verifyPayment = async (response) => {
    setLoading(true);
    try {
      const verifyResponse = await fetch(`${Backendurl}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
          paymentRecordId: paymentRecordId,
        }),
      });

      const data = await verifyResponse.json();

      if (data.success) {
        toast.success("Payment successful!");
        if (onPaymentSuccess) onPaymentSuccess(data.data.payment);
      } else {
        throw new Error(data.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error(error.message || "Payment verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = () => {
    toast.info("Please contact admin for cash payment processing");
    if (onPaymentCancel) onPaymentCancel();
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Details
        </h2>
        <p className="text-gray-600">{propertyTitle}</p>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Amount:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Select Payment Method
          </h3>

          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={() => handlePaymentMethodChange("razorpay")}
                className="mr-3"
              />
              <CreditCard className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Online Payment</div>
                <div className="text-sm text-gray-600">
                  Credit/Debit Card, UPI, Net Banking
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => handlePaymentMethodChange("cash")}
                className="mr-3"
              />
              <DollarSign className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Cash Payment</div>
                <div className="text-sm text-gray-600">
                  Pay in cash to admin
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {paymentMethod === "razorpay" ? (
            <button
              onClick={handleRazorpayPayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-5 h-5 mr-2" />
              )}
              Pay {formatCurrency(amount)}
            </button>
          ) : (
            <button
              onClick={handleCashPayment}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Contact Admin for Cash Payment
            </button>
          )}

          <button
            onClick={() => {
              if (onPaymentCancel) onPaymentCancel();
            }}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by Razorpay</p>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
};

export default PaymentComponent;
