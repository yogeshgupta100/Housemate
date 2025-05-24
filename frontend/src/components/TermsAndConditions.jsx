export default function TermsAndConditions() {
  return (
    <div className="flex flex-col items-center px-6 pt-4 pb-2 max-h-[80vh] overflow-y-auto">
      <div className="flex flex-row items-center justify-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-center">
          Rental Terms & Conditions
        </h2>
      </div>
      <p className="text-gray-600 text-center mb-4">
        Please review the following terms before proceeding with your rental.
      </p>
      <div className="bg-gray-50 rounded-lg p-4 text-gray-700 w-full max-w-2xl text-sm space-y-3">
        <p>
          <strong>1. Eligibility:</strong> You must be 18+ and provide accurate
          information during the rental process.
        </p>
        <p>
          <strong>2. Agreement:</strong> All rentals are strictly between the
          property owner and the tenant.
        </p>
        <p>
          <strong>3. Verification:</strong> Owners may require identity or
          background verification before approval.
        </p>
        <p>
          <strong>4. Security Deposit:</strong> Must be paid in advance. Refund
          rules depend on the owner’s policy.
        </p>
        <p>
          <strong>5. Property Condition:</strong> Tenants are responsible for
          maintaining the property’s condition.
        </p>
        <p>
          <strong>6. Rent Payment:</strong> Rent must be paid on time. Late
          payments may lead to penalties or eviction.
        </p>
        <p>
          <strong>7. Cancellation:</strong> You may cancel before signing the
          lease. Post-signing, refer to the agreement.
        </p>
        <p>
          <strong>8. Conduct:</strong> Illegal activities and disturbing the
          neighborhood are strictly prohibited.
        </p>
        <p>
          <strong>9. Disputes:</strong> All disputes must be resolved between
          the tenant and the owner directly.
        </p>
        <p>
          <strong>10. Liability:</strong> We are not liable for disputes,
          damages, or financial losses related to rentals.
        </p>
      </div>
      <p className="text-sm text-center text-gray-500 mt-4">
        By proceeding, you agree to these Terms & Conditions.
      </p>
    </div>
  );
}
