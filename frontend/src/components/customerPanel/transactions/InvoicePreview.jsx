import React from 'react';
import { Download, Printer } from 'lucide-react';

const InvoicePreview = ({ invoice, transaction }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Invoice #{invoice.invoiceNumber}</h3>
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors">
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </button>
          <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-600 mb-1">BuildEstate</h2>
            <p className="text-sm text-gray-500">123 Real Estate Ave</p>
            <p className="text-sm text-gray-500">New York, NY 10001</p>
            <p className="text-sm text-gray-500">contact@buildestate.com</p>
            <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold mb-1">INVOICE</p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Invoice Number:</span> {invoice.invoiceNumber}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Date:</span> {formatDate(invoice.date)}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="font-medium text-gray-700 mb-2">Bill To:</p>
            <p className="font-semibold">{transaction.buyer.name}</p>
            <p className="text-sm text-gray-500">{transaction.buyer.email}</p>
            <p className="text-sm text-gray-500">{transaction.buyer.phone}</p>
            <p className="text-sm text-gray-500">
              {transaction.buyer.address}, {transaction.buyer.city}, {transaction.buyer.state} {transaction.buyer.zip}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">Transaction Details:</p>
            <p className="text-sm">
              <span className="font-medium">Type:</span> {transaction.type}
            </p>
            <p className="text-sm">
              <span className="font-medium">Property:</span> {transaction.property.title}
            </p>
            <p className="text-sm">
              <span className="font-medium">Location:</span> {transaction.property.location}, {transaction.property.city}, {transaction.property.state}
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span> {transaction.status}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-4">{item.description}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <p className="font-medium text-gray-700 mb-2">Taxes & Fees:</p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Percentage</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.taxes.map((tax, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-4">{tax.description}</td>
                  <td className="py-3 px-4 text-right">{tax.percentage}%</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(tax.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between mb-2">
            <p className="font-medium">Subtotal:</p>
            <p>{formatCurrency(invoice.amount)}</p>
          </div>
          <div className="flex justify-between mb-2">
            <p className="font-medium">Taxes & Fees:</p>
            <p>{formatCurrency(invoice.taxes.reduce((acc, tax) => acc + tax.amount, 0))}</p>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300 mt-2">
            <p>Total:</p>
            <p>{formatCurrency(invoice.totalAmount)}</p>
          </div>
          <div className="flex justify-between text-green-600 mt-2">
            <p className="font-medium">Paid:</p>
            <p>{formatCurrency(invoice.paidAmount)}</p>
          </div>
          <div className="flex justify-between font-bold mt-2">
            <p>Balance Due:</p>
            <p>{formatCurrency(invoice.dueAmount)}</p>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500 border-t border-gray-200 pt-4">
          <p className="font-medium mb-2">Payment Information:</p>
          <p>Please make checks payable to: BuildEstate, Inc.</p>
          <p>Wire Transfer to: Bank of America</p>
          <p>Account #: XXXX-XXXX-XXXX-1234</p>
          <p>Routing #: XXXXXXXX</p>
          <p className="mt-4">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;