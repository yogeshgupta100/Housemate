import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  IndianRupee,
  BedDouble,
  Bath,
  Maximize,
  Heart,
  Eye,
  ArrowRight,
  Building,
  Search,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Backendurl } from "../App";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const PropertyCard = ({ property, favorites }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    // Check if the current property is in favorites
    const isPropertyFavorited = favorites?.some(
      (fav) => fav.property_id === property.id
    );
    setIsFavorite(isPropertyFavorited);
  }, [favorites, property.id]);

  const handleNavigate = () => {
    navigate(`/properties/single/${property.id}`);
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const response = await axios.post(
        `${Backendurl}/api/favorites/${property.id}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        setIsFavorite(!isFavorite);
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "An error occurred. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getListingStatus = () => {
    if (property.availability?.status) {
      return property.availability.status;
    }
    return property.listing_type || "Sale";
  };

  const getBadgeColor = () => {
    const status = getListingStatus().toLowerCase();
    if (status === "rented" || status === "sold") {
      return "bg-gray-600 text-white";
    }
    if (status === "rent" || status === "rental" || status === "available") {
      return "bg-green-600 text-white";
    }
    return "bg-purple-600 text-white";
  };

  const formatListingType = (status) => {
    const statusMap = {
      rent: "Rental",
      sale: "Sale",
      buy: "Sale",
      available: "Available",
      rented: "Rented",
      sold: "Sold",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={handleNavigate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-64">
        <img
          src={property?.images?.[0]}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-6 left-4 flex flex-col gap-2">
          <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-md">
            {property.type}
          </span>
        </div>

        <button
          onClick={toggleFavorite}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 cursor-pointer z-20
                ${
                  isFavorite
                    ? "bg-red-500 text-white"
                    : "bg-white/80 backdrop-blur-sm text-gray-700 hover:text-red-500"
                }`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="px-5 py-3 bg-white text-blue-600 rounded-lg font-medium flex items-center gap-2 shadow-lg"
              >
                <Eye className="w-5 h-5" />
                View Details
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        <div className="flex justify-between items-center py-3 border-y border-gray-100 mb-4">
          <div className="flex items-center gap-1">
            <BedDouble className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              {property.beds} {property.beds > 1 ? "Beds" : "Bed"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              {property.baths} {property.baths > 1 ? "Baths" : "Bath"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">{property.sqft} sqft</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-blue-600 font-bold">
            <IndianRupee className="h-5 w-5 mr-1" />
            <span className="text-xl">
              {Number(property.price).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-md flex items-center">
            <Building className="w-3.5 h-3.5 mr-1" />
            {formatListingType(getListingStatus())}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PropertiesShow = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const { user, isLoggedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await axios.get(
          `${Backendurl}/api/favorites/check/${user?.data?.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setFavorites(response.data.favorites);
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };
    checkFavoriteStatus();
  }, []);

  const categories = [
    { id: "all", label: "All Properties" },
    { id: "apartment", label: "Apartments" },
    { id: "villa", label: "Villas" },
    { id: "house", label: "Houses" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        queryParams.append("verified", true);
        console.log("queryParams:", queryParams.toString());
        const response = await axios.get(
          `${Backendurl}/api/properties/search?${queryParams}`
        );

        if (response.data.success) {
          const properties = response?.data?.properties || [];
          console.log("Fetched properties:", properties); // Debug log
          setProperties(properties);
        } else {
          console.error("API response indicated failure:", response.data);
          setError("Failed to fetch properties");
          setProperties([]);
        }
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties");
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const filteredProperties =
    activeCategory === "all"
      ? properties?.slice(0, 6)
      : properties.filter(
          (property) => property.type?.toLowerCase() === activeCategory
        );

  const viewAllProperties = () => {
    navigate("/properties");
  };

  if (loading) {
    return (
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/4 mx-auto mb-16"></div>

            <div className="h-10 bg-gray-100 rounded-lg w-full max-w-md mx-auto mb-8 flex justify-center gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-8 bg-gray-200 rounded-full w-24"
                ></div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-xl shadow h-96">
                  <div className="h-64 bg-gray-200 rounded-t-xl"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Properties
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium properties
          </p>
        </div>

        {/* Authentication Notice */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-4xl mx-auto"
          >
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Login Required to View Property Details
                </h3>
                <p className="text-sm text-blue-700">
                  Please sign in or create an account to view detailed property
                  information, contact details, and 360° virtual tours.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search properties by location, type, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredProperties.slice(0, 6).map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                favorites={favorites}
              />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button
            onClick={viewAllProperties}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 font-medium"
          >
            Browse All Properties
            <ArrowRight className="ml-2 w-4 h-4" />
          </button>
          <p className="text-gray-600 mt-4 text-sm">
            Discover our complete collection of premium properties
          </p>
        </motion.div>
      </div>
    </section>
  );
};

PropertyCard.propTypes = {
  property: PropTypes.object.isRequired,
};

export default PropertiesShow;
