import React from "react";
import { Helmet } from "react-helmet-async";

const ShippingPolicy = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
    <Helmet>
      <title>Shipping & Delivery Policy - Housemate</title>
      <meta
        name="description"
        content="Read Housemate's shipping and delivery policy for property bookings and services."
      />
      <meta
        name="keywords"
        content="shipping policy, delivery, Housemate, property, service"
      />
    </Helmet>
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Shipping & Delivery Policy
      </h1>
      <p className="mb-4 text-gray-700">
        Housemate is a digital platform for property listings and rentals. We do
        not ship any physical goods. All services are delivered electronically
        through our website and app.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Service Delivery</h2>
      <ul className="list-disc ml-6 text-gray-700 mb-4">
        <li>
          All property listings, bookings, and related services are provided
          online via the Housemate platform.
        </li>
        <li>
          Upon successful payment and confirmation, users receive access to the
          booked property or service as per the agreed terms.
        </li>
        <li>
          There is no physical shipping involved for any service offered on
          Housemate.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Delivery Timeline</h2>
      <ul className="list-disc ml-6 text-gray-700 mb-4">
        <li>
          Access to digital services is granted immediately upon successful
          transaction and verification.
        </li>
        <li>
          For any issues with service access, please contact us at{" "}
          <a
            href="mailto:Be.housemate@gmail.com"
            className="text-blue-600 underline"
          >
            Be.housemate@gmail.com
          </a>
          .
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Contact & Support</h2>
      <ul className="list-disc ml-6 text-gray-700 mb-4">
        <li>
          For questions about service delivery, contact our support team at{" "}
          <a
            href="mailto:Be.housemate@gmail.com"
            className="text-blue-600 underline"
          >
            Be.housemate@gmail.com
          </a>
          .
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Changes to Policy</h2>
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

export default ShippingPolicy;
