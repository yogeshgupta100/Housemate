import VirtualTour from '../components/VirtualTour';

const PropertyDetail = () => {
  return (
    <div>
      {/* Add Virtual Tour Section */}
      {property?.room_id && (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Virtual Tour</h2>
            <VirtualTour roomId={property.room_id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail; 