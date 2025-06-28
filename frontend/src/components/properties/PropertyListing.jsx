import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Info } from "lucide-react";
import PropertyCard from "./Propertycard.jsx";
import { useAuth } from "../../context/AuthContext";

const PropertyListing = ({
  properties,
  loading,
  error,
  isGridView,
  onSortChange,
  sortBy,
  children // This will be used for the search bar and filters
}) => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="lg:col-span-4">
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        {children}
      </div>

      {/* Authentication Notice */}
      {!isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Login Required to View Property Details
              </h3>
              <p className="text-sm text-blue-700">
                Please sign in or create an account to view detailed property information, contact details, and 360° virtual tours.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <motion.div layout className={`grid gap-6 ${isGridView ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          <AnimatePresence>
            {properties.length > 0 ? (
              properties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  viewType={isGridView ? "grid" : "list"} 
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm"
              >
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default PropertyListing; 