import React from 'react';
import PropertyVirtualTour from '../components/PropertyVirtualTour';

const PropertyDetail = ({ property }) => {
  return (
    <div>
      {/* Property Virtual Tour Section */}
      {property?.id && (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <PropertyVirtualTour propertyId={property.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail; 