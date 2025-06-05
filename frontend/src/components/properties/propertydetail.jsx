import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble,
  Bath,
  Maximize,
  ArrowLeft,
  Phone,
  Calendar,
  MapPin,
  Loader,
  Building,
  Share2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Compass,
  AlertTriangle,
  Home,
  Edit
} from "lucide-react";
import { Backendurl } from "../../App.jsx";
import ScheduleViewing from "./ScheduleViewing";
import { RoomGrid } from "./RoomGrid";
import GeneralModal from "../GeneralModal.jsx";
import TermsAndConditions from "../TermsAndConditions.jsx";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [openTermsAndConditions, setOpenTermsAndConditions] = useState(false);
  const navigate = useNavigate();
  const {user} = useAuth();

  
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${Backendurl}/api/properties/${id}`);
        
        if (response.data.success) {
          setProperty(response.data.property);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to fetch property details");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProperty();
    }
  }, [id]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveMediaIndex(0);
  }, [id]);
  
  const getMediaGallery = (property) => {
    if (!property) return [];
    const images = (property.images || []).map((url) => ({ type: "image", url }));
    const videos = (property.videos || []).map((url) => ({ type: "video", url }));
    return [...images, ...videos];
  };
  
  const mediaGallery = getMediaGallery(property);
  
  const parseAmenities = (amenities) => {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities;
    try {
      return typeof amenities === "string" ? JSON.parse(amenities) : [];
    } catch (error) {
      console.error("Error parsing amenities:", error);
      return [];
    }
  };

  const getPropertyStatus = (property) => {
    if (!property) return "N/A";
    if (
      typeof property.availability === "object" &&
      property.availability?.status
    ) {
      return property.availability.status;
    }
    return property.availability || property.listing_type || "N/A";
  };

  const handleKeyNavigation = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") {
        setActiveMediaIndex((prev) =>
          prev === 0 ? property.image.length - 1 : prev - 1
        );
      } else if (e.key === "ArrowRight") {
        setActiveMediaIndex((prev) =>
          prev === property.image.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === "Escape" && showSchedule) {
        setShowSchedule(false);
      }
    },
    [property?.image?.length, showSchedule]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyNavigation);
    return () => window.removeEventListener("keydown", handleKeyNavigation);
  }, [handleKeyNavigation]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: property.title,
          text: `Check out this ${property.type}: ${property.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleAccept = async () => {
    try {
      const user_id = user?.data?.id;
      if (!user_id) {
        navigate("/login");
        toast.error("Please login to continue");
        window.scrollTo(0, 0 , {
          behavior: "smooth"
        });
        return;
      }
      if (!selectedRoom) {
        toast.error('Please select a room.');
        return;
      }
      const transactionData = {
        property_id: property.id,
        floor_id: selectedRoom.floor_id,
        room_id: selectedRoom.id,
        user_id,
        move_in_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      };
      const response = await axios.post(`${Backendurl}/api/transactions`, transactionData);
      if (response.data.success) {
        setOpenTermsAndConditions(false);
        navigate('/customer-panel/transactions');
      } else {
        toast.error('Failed to create transaction: ' + response.data.message);
      }
    } catch (error) {
      toast.error('Error creating transaction: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = () => {
    navigate(`/list-property?edit=${id}`);
  };

  const isOwner = user?.data?.id === property?.user_id;
  const isShow = location.pathname.includes('customer-panel');

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isShow ? 'pt-0' : 'pt-16'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="w-32 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex items-center gap-2">
              {isShow && <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>}
              <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-[500px] bg-gray-200 rounded-xl mb-8 animate-pulse">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/50 rounded-full"></div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/50 rounded-full"></div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-8 bg-black/20 rounded-full"></div>
            </div>

            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-3 w-full max-w-md">
                  <div className="h-10 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-1/2 animate-pulse"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="h-28 bg-blue-50/50 rounded-lg animate-pulse"></div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-24 bg-gray-100 rounded-lg animate-pulse"
                      ></div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="h-7 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded-lg w-1/2 animate-pulse"></div>
                  </div>

                  <div className="h-12 bg-blue-200 rounded-lg animate-pulse"></div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="h-7 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse mt-2"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-4/5 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse"></div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-7 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-6 bg-gray-200 rounded-lg animate-pulse"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50/50 rounded-xl animate-pulse">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
              <div className="h-7 bg-gray-300 rounded-lg w-1/6"></div>
            </div>
            <div className="h-5 bg-gray-300 rounded-lg w-4/5 mb-4"></div>
            <div className="h-6 bg-gray-300 rounded-lg w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen pt-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center py-12 bg-white rounded-lg shadow">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Property Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the property you're looking for.
          </p>
          <Link
            to={isShow ? '/customer-panel/properties' : '/properties'}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {isShow ? 'My Properties' : 'Properties'}
          </Link>
        </div>
      </div>
    );
  }

  const images = getMediaGallery(property);
  const amenities = parseAmenities(property.amenities);
  const status = getPropertyStatus(property);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen bg-gray-50 ${isShow ? 'pt-0' : 'pt-16'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center justify-between mb-8">
          <Link
            to={isShow ? '/customer-panel/properties' : '/properties'}
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to {isShow ? 'My Properties' : 'Properties'}
          </Link>
          <div className="flex gap-2">
            {isOwner && isShow && (
              <button
                onClick={handleEdit}
                className="py-2 px-4 rounded-lg hover:bg-blue-400 flex items-center gap-2 bg-blue-600 text-white"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                hover:bg-gray-100 transition-colors relative"
            >
              {copySuccess ? (
                <span className="text-green-600">
                  <Copy className="w-5 h-5" />
                  Copied!
                </span>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Share
                </>
              )}
            </button>
          </div>
        </nav>

        <div className={`${isShow ? 'bg-gray-50' : 'bg-white shadow-lg'} rounded-xl overflow-hidden`}>
          <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-8 flex" style={{ height: '400px', minHeight: '225px' }}>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-full aspect-video flex items-center justify-center bg-black rounded-xl overflow-hidden">
                {mediaGallery[activeMediaIndex]?.type === "image" ? (
                  <img
                    src={mediaGallery[activeMediaIndex].url}
                    alt={`Media ${activeMediaIndex + 1}`}
                    className="w-full h-full object-contain"
                    style={{ aspectRatio: '16/9' }}
                  />
                ) : (
                  <video
                    src={mediaGallery[activeMediaIndex].url}
                    controls
                    className="w-full h-full object-contain"
                    style={{ aspectRatio: '16/9' }}
                  />
                )}
              </div>
            </div>
            {/* Sidebar Thumbnails */}
            {mediaGallery.length > 1 && (
              <div
                className={`w-40 flex flex-col gap-2 mx-4 overflow-y-auto`}
                style={{ maxHeight: '400px', height: '400px' }}
              >
                {mediaGallery.map((media, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`border-2 rounded-lg overflow-hidden ${activeMediaIndex === idx ? "border-blue-600" : "border-transparent"}`}
                    style={{
                      aspectRatio: '16/9',
                      height: '133.33px',
                      minHeight: '133.33px',
                      maxHeight: '133.33px',
                    }}
                  >
                    {media.type === "image" ? (
                      <img src={media.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" style={{ aspectRatio: '16/9' }} />
                    ) : (
                      <video src={media.url} className="w-full h-full object-cover" style={{ aspectRatio: '16/9' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>

          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {property.title}
                </h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  {property.location}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      property.listing_type === "rent"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    <Home className="w-4 h-4 mr-1" />
                    {property.listing_type === "rent"
                      ? "Rental Property"
                      : "Sale Property"}
                  </span>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  {property.listing_type === "rent" ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-3xl font-bold text-blue-600">
                          ₹{Number(property.price).toLocaleString("en-IN")}
                          <span className="text-sm text-gray-600 font-normal">
                            /{property.rent_type}
                          </span>
                        </p>
                      </div>
                      <div className="border-t border-blue-100 pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">
                            Security Deposit
                          </span>
                          <span className="font-semibold text-gray-800">
                            ₹{Number(property.deposit).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {property.availability?.availableFrom && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">
                              Available From
                            </span>
                            <span className="font-semibold text-gray-800">
                              {new Date(
                                property.availability.availableFrom
                              ).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {property.availability?.minLeasePeriod && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Minimum Lease</span>
                            <span className="font-semibold text-gray-800">
                              {property.availability.minLeasePeriod}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-3xl font-bold text-blue-600">
                          ₹{Number(property.price).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="border-t border-blue-100 pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Property Age</span>
                          <span className="font-semibold text-gray-800">
                            {property.propertyAge} years
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Condition</span>
                          <span className="font-semibold text-gray-800 capitalize">
                            {property.propertyCondition
                              ? property.propertyCondition.replace(/_/g, " ")
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status</span>
                          <span className="font-semibold text-gray-800 capitalize">
                            {property.propertyStatus
                              ? property.propertyStatus.replace(/_/g, " ")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!["flat", "pg", "rk"].includes(property.type) && <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <BedDouble className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {property.beds} {property.beds > 1 ? "Beds" : "Bed"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Bath className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {property.baths} {property.baths > 1 ? "Baths" : "Bath"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Maximize className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {property.sqft} sqft
                    </p>
                  </div>
                </div>}

                {property?.listing_type !== "rent" && <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Contact Details
                  </h2>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-2" />
                    {property.phone}
                  </div>
                </div>}

                <button
                  onClick={() => setShowSchedule(true)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg 
                    hover:bg-blue-700 transition-colors flex items-center 
                    justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule Viewing
                </button>
              </div>

              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Description</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {property.description}
                  </p>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center text-gray-600"
                      >
                        <Building className="w-4 h-4 mr-2 text-blue-600" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>

                {["pg", "rk", "flat"].includes(property.type) && (
                  <div className="my-8">
                    <h2 className="text-lg font-semibold mb-2">
                      Available Rooms
                    </h2>
                    <RoomGrid
                      floorDetails={property?.floorDetails}
                      selectedRoom={selectedRoom?.id}
                      onReserve={(room, floorId) => {
                        setSelectedRoom({ ...room, floor_id: floorId });
                        setOpenTermsAndConditions(true);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <Compass className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Location</h3>
          </div>
          <p className="text-gray-600 mb-4">{property.location}</p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              property.location
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <MapPin className="w-4 h-4" />
            View on Google Maps
          </a>
        </div>

        <AnimatePresence>
          {showSchedule && (
            <ScheduleViewing
              propertyId={property.id}
              propertyTitle={property.title}
              propertyLocation={property.location}
              onClose={() => setShowSchedule(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {openTermsAndConditions && (
            <GeneralModal
              open={openTermsAndConditions}
              onClose={() => setOpenTermsAndConditions(false)}
            >
              <TermsAndConditions />
              <div className="flex flex-row items-center justify-center mt-2">
                <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleAccept}
                >
                  Accept
                </button>
              </div>
            </GeneralModal>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PropertyDetails;
