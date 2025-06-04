import React from 'react';
import { Download, Printer } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const AgreementPreview = ({ agreement }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('agreement-content');
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const handleDownload = () => {
    const element = document.getElementById('agreement-content');
    const opt = {
      margin: 1,
      filename: `agreement-${agreement.agreementNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Agreement #{agreement.agreementNumber}</h3>
        <div className="flex space-x-2">
          <button 
            onClick={handlePrint}
            className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </button>
        </div>
      </div>

      <div id="agreement-content" className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-1">PROPERTY SALES AGREEMENT</h2>
          <p className="text-sm text-gray-500">Agreement #{agreement.agreementNumber}</p>
          <p className="text-sm text-gray-500">Date: {formatDate(agreement.date)}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">1. PARTIES</h3>
          <p className="mb-4">
            This Property Sales Agreement (hereinafter referred to as the "Agreement") is entered
            into on {formatDate(agreement.date)} by and between:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-md p-4">
              <h4 className="font-medium mb-2">Seller:</h4>
              <p className="font-semibold">{agreement.parties.seller.name}</p>
              <p className="text-sm text-gray-600">{agreement.parties.seller.address}</p>
              <p className="text-sm text-gray-600">
                {agreement.parties.seller.city}, {agreement.parties.seller.state} {agreement.parties.seller.zip}
              </p>
              <p className="text-sm text-gray-600">{agreement.parties.seller.email}</p>
              <p className="text-sm text-gray-600">{agreement.parties.seller.phone}</p>
            </div>
            <div className="border border-gray-200 rounded-md p-4">
              <h4 className="font-medium mb-2">Buyer:</h4>
              <p className="font-semibold">{agreement.parties.buyer.name}</p>
              <p className="text-sm text-gray-600">{agreement.parties.buyer.address}</p>
              <p className="text-sm text-gray-600">
                {agreement.parties.buyer.city}, {agreement.parties.buyer.state} {agreement.parties.buyer.zip}
              </p>
              <p className="text-sm text-gray-600">{agreement.parties.buyer.email}</p>
              <p className="text-sm text-gray-600">{agreement.parties.buyer.phone}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">2. PROPERTY</h3>
          <p className="mb-4">
            The Seller agrees to sell and the Buyer agrees to buy the following property:
          </p>
          <div className="border border-gray-200 rounded-md p-4">
            <p className="font-semibold">{agreement.property.title}</p>
            <p className="text-sm text-gray-600">{agreement.property.description}</p>
            <p className="text-sm text-gray-600">
              Location: {agreement.property.location}, {agreement.property.city}, {agreement.property.state}
            </p>
            <p className="text-sm text-gray-600">
              Property Type: {agreement.property.type}
            </p>
            <p className="text-sm text-gray-600">
              Area: {agreement.property.area} sq ft
            </p>
            {agreement.property.bedrooms && (
              <p className="text-sm text-gray-600">
                Bedrooms: {agreement.property.bedrooms}
              </p>
            )}
            {agreement.property.bathrooms && (
              <p className="text-sm text-gray-600">
                Bathrooms: {agreement.property.bathrooms}
              </p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">3. PURCHASE PRICE</h3>
          <p className="mb-4">
            The Buyer agrees to pay the Seller the sum of {formatCurrency(agreement.property.price)} for the Property
            under the terms and conditions set forth in this Agreement.
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">4. TERMS AND CONDITIONS</h3>
          <ul className="list-decimal pl-6 space-y-3">
            {agreement.terms.map((term, index) => (
              <li key={index} className="text-gray-700">{term}</li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">5. SIGNATURES</h3>
          <p className="mb-4">
            By signing below, the parties acknowledge that they have read, understood, and agree to the
            terms and conditions of this Agreement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <div className="mb-2">
                <p className="font-medium">Seller:</p>
                {agreement.signatures.seller ? (
                  <p className="font-semibold text-lg italic mt-4">{agreement.signatures.seller}</p>
                ) : (
                  <div className="h-10 border-b border-gray-300 mt-4"></div>
                )}
                <p className="mt-2 text-sm text-gray-500">{agreement.parties.seller.name}</p>
                <p className="text-sm text-gray-500">Date: {formatDate(agreement.date)}</p>
              </div>
            </div>
            <div>
              <div className="mb-2">
                <p className="font-medium">Buyer:</p>
                {agreement.signatures.buyer ? (
                  <p className="font-semibold text-lg italic mt-4">{agreement.signatures.buyer}</p>
                ) : (
                  <div className="h-10 border-b border-gray-300 mt-4"></div>
                )}
                <p className="mt-2 text-sm text-gray-500">{agreement.parties.buyer.name}</p>
                <p className="text-sm text-gray-500">Date: {formatDate(agreement.date)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
          <p className="font-medium">HOUSEMATE, Inc.</p>
          <p>123 Real Estate Ave, New York, NY 10001</p>
          <p>contact@housemate.com | +1 (555) 123-4567</p>
        </div>
      </div>
    </div>
  );
};

export default AgreementPreview;