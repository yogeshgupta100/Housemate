import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import PropertyCard from "./Propertycard.jsx";

const PropertyListing = ({
  properties,
  loading,
  error,
  isGridView,
  onSortChange,
  sortBy,
  children // This will be used for the search bar and filters
}) => {
  return (
    <div className="lg:col-span-4">
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        {children}
      </div>

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