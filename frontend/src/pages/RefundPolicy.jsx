import React from "react";
import { Helmet } from "react-helmet-async";

const RefundPolicy = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
    <Helmet>
      <title>Cancellation & Refund Policy - Housemate</title>
      <meta
        name="description"
        content="Read Housemate's cancellation and refund policy for property bookings and payments."
      />
      <meta
        name="keywords"
        content="refund policy, cancellation, Housemate, property, payment"
      />
    </Helmet>
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Cancellation & Refund Policy
      </h1>
      <p className="mb-4 text-gray-700">
        We value your trust and strive to provide a transparent and fair
        cancellation and refund process for all our users.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. Cancellation by User
      </h2>
      <ul className="list-disc ml-6 text-gray-700 mb-4">
        <li>
          You may cancel your booking before payment is completed without any
          charges.
        </li>
        <li>
          If you wish to cancel after payment but before move-in, please contact
          us at{" "}
          <a
            href="mailto:Be.housemate@gmail.com"
            className="text-blue-600 underline"
          >
            Be.housemate@gmail.com
          </a>
          .
        </li>
        <li>
          Refunds for cancellations after payment are subject to the property
          owner's approval and the terms agreed at booking.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        2. Cancellation by Property Owner
      </h2>
      <ul className="list-disc ml-6 text-gray-700 mb-4">
        <li>
          If a property owner cancels a confirmed booking, you will receive a
          full refund of any payment made.
        </li>
        <li>
          We will notify you by email and process the refund within 7-10
          business days.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Refund Process</h2>
      <ul className="list-disc ml-6 text-gray-700 mb-4">
        <li>
          Refunds are processed to the original payment method used at the time
          of booking.
        </li>
        <li>
          Refunds may take 7-10 business days to reflect in your account,
          depending on your bank or payment provider.
        </li>
        <li>
          For any refund-related queries, contact us at{" "}
          <a
            href="mailto:Be.housemate@gmail.com"
            className="text-blue-600 underline"
          >
            Be.housemate@gmail.com
          </a>
          .
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        4. Non-Refundable Situations
      </h2>
      <ul className="list-disc ml-6 text-gray-700 mb-4">
        <li>
          Payments made for completed stays or after move-in are non-refundable
          unless otherwise stated in the property agreement.
        </li>
        <li>Service fees, if any, are non-refundable.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Changes to Policy</h2>
      <p className="text-gray-700 mb-4">
        We reserve the right to update this policy at any time. Changes will be
        posted on this page with the updated date.
      </p>
      <p className="text-gray-500 text-sm mt-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  </div>
);

export default RefundPolicy;
