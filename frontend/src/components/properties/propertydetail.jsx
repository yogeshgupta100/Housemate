import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Building,
  Share2,
  Copy,
  Compass,
  AlertTriangle,
  Home,
  Edit,
  Save,
  X
} from "lucide-react";
import { Backendurl } from "../../App.jsx";
import ScheduleViewing from "./ScheduleViewing";
import { RoomGrid } from "./RoomGrid";
import GeneralModal from "../GeneralModal.jsx";
import TermsAndConditions from "../TermsAndConditions.jsx";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import PanoramaViewer from '../PanoramaViewer';
import FullscreenMediaViewer from '../FullscreenMediaViewer';
import PropertyVirtualTour from '../PropertyVirtualTour';

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
  const [roomStatus, setRoomStatus] = useState([]);
  const [roomStatusLoading, setRoomStatusLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomDescription, setRoomDescription] = useState('');
  const navigate = useNavigate();
  const {user} = useAuth();
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [fullViewIndex, setFullViewIndex] = useState(0);
  const fullViewMediaRef = useRef(null);

  
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
  
  // Auto-select first room for 360° virtual tour when property loads
  useEffect(() => {
    if (property && (property.type === "pg" || property.type === "rk" || property.type === "flat")) {
      const firstFloor = property.floorDetails?.[0];
      const firstRoom = firstFloor?.rooms?.[0];
      
      if (firstRoom && !selectedRoom) {
        setSelectedRoom({ ...firstRoom, floor_id: firstFloor.id });
      }
    }
  }, [property, selectedRoom]);
  
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

      if (selectedRoom.occupied >= selectedRoom.capacity) {
        toast.error('This room has reached its maximum capacity.');
        return;
      }

      const transactionData = {
        property_id: property.id,
        floor_id: selectedRoom.floor_id,
        room_id: selectedRoom.id,
        user_id,
        move_in_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        description: '',
      };

      // Create transaction
      const response = await axios.post(`${Backendurl}/api/transactions`, transactionData);
      
      if (response.data.success) {
        // Update room occupancy
        await axios.put(`${Backendurl}/api/properties/rooms/${selectedRoom.id}/occupy`, {
          increment: true
        });

        setOpenTermsAndConditions(false);
        toast.success('Room booking request submitted successfully');
        navigate('/customer-panel/transactions');
      } else {
        toast.error('Failed to create transaction: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error in handleAccept:', error);
      toast.error('Error creating transaction: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = () => {
    navigate(`/list-property?edit=${id}`);
  };

  const isOwner = user?.data?.id === property?.user_id;
  const isShow = location.pathname.includes('customer-panel');

  useEffect(() => {
    if (isOwner && property?.id) {
      setRoomStatusLoading(true);
      axios.get(`${Backendurl}/api/properties/${property.id}/room-status`)
        .then(res => {
          if (res.data.success) setRoomStatus(res.data.data);
        })
        .catch(() => setRoomStatus([]))
        .finally(() => setRoomStatusLoading(false));
    }
  }, [isOwner, property?.id]);

  const handleEditDescription = (room) => {
    setEditingRoom(room);
    setRoomDescription(room.description);
  };

  const handleSaveDescription = async () => {
    if (!editingRoom?.roomId) {
      toast.error('Invalid room selected');
      return;
    }

    try {
      const response = await axios.put(`${Backendurl}/api/properties/rooms/${editingRoom.roomId}/description`, {
        description: roomDescription
      });
      
      if (response.data.success) {
        // Refresh room status
        const res = await axios.get(`${Backendurl}/api/properties/${property.id}/room-status`);
        if (res.data.success) {
          setRoomStatus(res.data.data);
          toast.success('Room description updated successfully');
        }
        setEditingRoom(null);
        setRoomDescription('');
      } else {
        toast.error('Failed to update room description');
      }
    } catch (error) {
      console.error('Error updating room description:', error);
      toast.error('Failed to update room description: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMakeAvailable = async (roomId) => {
    try {
      const res = await axios.post(`${Backendurl}/api/admin/rooms/make-available-request`, {
        roomId,
        propertyId: property.id,
        ownerId: user.data.id,
      });
      if (res.data.success) {
        toast.success('Request sent to admin!');
      } else {
        toast.error(res.data.message || 'Failed to send request');
      }
    } catch (err) {
      toast.error('Error sending request');
    }
  };

  // Fullscreen API handler
  const handleGoFullscreen = () => {
    if (fullViewMediaRef.current) {
      if (fullViewMediaRef.current.requestFullscreen) {
        fullViewMediaRef.current.requestFullscreen();
      } else if (fullViewMediaRef.current.webkitRequestFullscreen) {
        fullViewMediaRef.current.webkitRequestFullscreen();
      } else if (fullViewMediaRef.current.mozRequestFullScreen) {
        fullViewMediaRef.current.mozRequestFullScreen();
      } else if (fullViewMediaRef.current.msRequestFullscreen) {
        fullViewMediaRef.current.msRequestFullscreen();
      }
    }
  };

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
              <div className="w-full max-w-full aspect-video flex items-center justify-center bg-black rounded-xl overflow-hidden relative group">
                {mediaGallery[activeMediaIndex]?.type === "image" ? (
                  <>
                    <div className="w-full h-full flex items-center justify-center relative">
                    <img
                      src={mediaGallery[activeMediaIndex].url}
                      alt={`Media ${activeMediaIndex + 1}`}
                      className="w-full h-full object-contain"
                      style={{ aspectRatio: '16/9' }}
                    />
                    <button
                      className={`absolute ${mediaGallery?.length > 1 ? 'top-[76%] right-[4%]' : 'top-[72%] right-[2%]'} bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition z-10 opacity-0 group-hover:opacity-100`}
                      title="View Fullscreen"
                      onClick={() => {
                        setFullViewIndex(activeMediaIndex);
                        setIsFullViewOpen(true);
                      }}
                    >
                      <Maximize className="w-5 h-5" />
                    </button>
                    </div>
                  </>
                ) : (
                  <>
                    <video
                      src={mediaGallery[activeMediaIndex].url}
                      controls
                      className="w-full h-full object-contain"
                      style={{ aspectRatio: '16/9' }}
                    />
                    <button
                      className={`absolute ${mediaGallery?.length > 1 ? 'top-[76%] right-[4%]' : 'top-[72%] right-[2%]'} bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition z-10 opacity-0 group-hover:opacity-100`}
                      title="View Fullscreen"
                      onClick={() => {
                        setFullViewIndex(activeMediaIndex);
                        setIsFullViewOpen(true);
                      }}
                    >
                      <Maximize className="w-5 h-5" />
                    </button>
                  </>
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

          {/* Fullscreen Modal for Media */}
          <FullscreenMediaViewer
            open={isFullViewOpen}
            onClose={() => setIsFullViewOpen(false)}
            mediaGallery={mediaGallery}
            startIndex={fullViewIndex}
          />

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

                  {/* Property-Specific Details */}
                  {property.listing_type === "sale" && (
                    <>
                      {/* Office-Specific Details */}
                      {property.type === "office" && (
                        <div className="mb-6">
                          <h2 className="text-xl font-semibold mb-4">Office Details</h2>
                          <div className="grid grid-cols-2 gap-4">
                            {property.office_area && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Area</span>
                                <span className="font-semibold text-gray-800">
                                  {property.office_area} sq ft
                                </span>
                              </div>
                            )}
                            {property.office_floors && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Floors</span>
                                <span className="font-semibold text-gray-800">
                                  {property.office_floors}
                                </span>
                              </div>
                            )}
                            {property.office_capacity && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Capacity</span>
                                <span className="font-semibold text-gray-800">
                                  {property.office_capacity} people
                                </span>
                              </div>
                            )}
                            {property.office_cabins && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Cabins</span>
                                <span className="font-semibold text-gray-800">
                                  {property.office_cabins}
                                </span>
                              </div>
                            )}
                            {property.meeting_rooms && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Meeting Rooms</span>
                                <span className="font-semibold text-gray-800">
                                  {property.meeting_rooms}
                                </span>
                              </div>
                            )}
                            {property.head_cabins && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Head Cabins</span>
                                <span className="font-semibold text-gray-800">
                                  {property.head_cabins}
                                </span>
                              </div>
                            )}
                          </div>
                          {property.office_amenities && property.office_amenities.length > 0 && (
                            <div className="mt-4">
                              <h3 className="text-lg font-medium mb-2">Office Amenities</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {property.office_amenities.map((amenity, index) => (
                                  <div key={index} className="flex items-center text-gray-600">
                                    <Building className="w-4 h-4 mr-2 text-blue-600" />
                                    {amenity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Plot-Specific Details */}
                      {(property.type === "commercial plot" || property.type === "residential plot") && (
                        <div className="mb-6">
                          <h2 className="text-xl font-semibold mb-4">Plot Details</h2>
                          <div className="grid grid-cols-2 gap-4">
                            {property.plot_area && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Area</span>
                                <span className="font-semibold text-gray-800">
                                  {property.plot_area} sq ft
                                </span>
                              </div>
                            )}
                            {property.nearby_area && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Nearby Area</span>
                                <span className="font-semibold text-gray-800">
                                  {property.nearby_area}
                                </span>
                              </div>
                            )}
                            {property.estimated_rental_income && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Estimated Rental Income</span>
                                <span className="font-semibold text-gray-800">
                                  ₹{Number(property.estimated_rental_income).toLocaleString("en-IN")}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Under Committee</span>
                              <span className="font-semibold text-gray-800">
                                {property.under_committee ? "Yes" : "No"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Passed Building Land</span>
                              <span className="font-semibold text-gray-800">
                                {property.passed_building_land ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Builder Floor/House-Specific Details */}
                      {(property.type === "builder floor" || property.type === "house") && (
                        <div className="mb-6">
                          <h2 className="text-xl font-semibold mb-4">
                            {property.type === "builder floor" ? "Builder Floor" : "House"} Details
                          </h2>
                          <div className="grid grid-cols-2 gap-4">
                            {property.type === "builder floor" && property.builder_floors && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Number of Floors</span>
                                <span className="font-semibold text-gray-800">
                                  {property.builder_floors}
                                </span>
                              </div>
                            )}
                            {property.house_area && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Area</span>
                                <span className="font-semibold text-gray-800">
                                  {property.house_area} sq ft
                                </span>
                              </div>
                            )}
                            {property.house_bedrooms && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Bedrooms</span>
                                <span className="font-semibold text-gray-800">
                                  {property.house_bedrooms}
                                </span>
                              </div>
                            )}
                            {property.house_bathrooms && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Bathrooms</span>
                                <span className="font-semibold text-gray-800">
                                  {property.house_bathrooms}
                                </span>
                              </div>
                            )}
                            {property.house_balcony && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Balconies</span>
                                <span className="font-semibold text-gray-800">
                                  {property.house_balcony}
                                </span>
                              </div>
                            )}
                            {property.house_parking && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Parking Spaces</span>
                                <span className="font-semibold text-gray-800">
                                  {property.house_parking}
                                </span>
                              </div>
                            )}
                            {property.house_location && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Location Details</span>
                                <span className="font-semibold text-gray-800">
                                  {property.house_location}
                                </span>
                              </div>
                            )}
                          </div>
                          {property.house_amenities && property.house_amenities.length > 0 && (
                            <div className="mt-4">
                              <h3 className="text-lg font-medium mb-2">House Amenities</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {property.house_amenities.map((amenity, index) => (
                                  <div key={index} className="flex items-center text-gray-600">
                                    <Building className="w-4 h-4 mr-2 text-blue-600" />
                                    {amenity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

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
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setOpenTermsAndConditions(true);
                      }}
                      className="w-fit bg-blue-600 text-white p-3 rounded-lg 
                      hover:bg-blue-700 transition-colors flex items-center 
                      justify-center gap-2"
                    >
                      {property.listing_type === "rent" ? "Rent" : "Buy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Room Status Table for Owner */}
            {isOwner && isShow && (
              <div className="px-8 pb-8">
                <h2 className="text-xl font-semibold mb-4 mt-2">Room & Rent Status</h2>
                {roomStatusLoading ? (
                  <div className="text-gray-500">Loading room status...</div>
                ) : roomStatus.length === 0 ? (
                  <div className="text-gray-500">No room data available.</div>
                ) : (
                  roomStatus.map(floor => (
                    <div key={floor.floor} className="mb-4">
                      <div className="font-semibold text-blue-700 mb-2">Floor {floor.floor}</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded-lg">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="px-4 py-2 border">Room</th>
                              <th className="px-4 py-2 border">Tenants</th>
                              <th className="px-4 py-2 border">Rent Collection Status</th>
                              <th className="px-4 py-2 border">Description</th>
                              <th className="px-4 py-2 border">Actions</th>
                              <th className="px-4 py-2 border"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {floor.rooms.map((room, idx) => (
                              <tr key={idx} className="text-center hover:bg-gray-50">
                                <td className="px-4 py-2 border">{room.roomNumber}</td>
                                <td className="px-4 py-2 border">{room.status}</td>
                                <td className="px-4 py-2 border">
                                  <span className={`px-2 py-1 rounded-full text-sm ${
                                    room.rentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                                    room.rentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                    room.rentStatus === 'No Bill' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {room.rentStatus === "pending" ? "NO" : "YES"}
                                  </span>
                                </td>
                                <td 
                                  className="px-4 py-2 border cursor-pointer"
                                  onClick={() => {
                                    if (!editingRoom) {
                                      setEditingRoom({ roomId: room.roomId });
                                      setRoomDescription(room.description || '');
                                    }
                                  }}
                                >
                                  {editingRoom?.roomId === room.roomId ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={roomDescription}
                                        onChange={(e) => setRoomDescription(e.target.value)}
                                        className="flex-1 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter room description"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  ) : (
                                    <span className="block text-gray-700">
                                      {room.description || 'No description'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 border">
                                  {editingRoom?.roomId === room.roomId ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveDescription();
                                        }}
                                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                        title="Save"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingRoom(null);
                                          setRoomDescription('');
                                        }}
                                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingRoom({ roomId: room.roomId });
                                        setRoomDescription(room.description || '');
                                      }}
                                      className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                                      title="Edit Description"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                                <td className="px-4 py-2 border">
                                  <button
                                    onClick={() => {
                                      handleMakeAvailable(room.roomId);
                                    }}
                                    className="p-2 text-white bg-green-600 hover:bg-green-700 transition-colors rounded-md"
                                    title="Make it Available"
                                  >
                                    Make it Available
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
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

        <div className="p-4 border-b">
          <h2 className="text-2xl font-semibold mb-4">360° Virtual Tour</h2>
          
          {/* Property-level 360° scenes for all property types */}
          {property?.floorDetails?.length === 0 && <div className="mb-6">
            <PropertyVirtualTour propertyId={property?.id} />
          </div>}

          {/* Room-level 360° scenes for PG, RK, and flat properties */}
          {(property?.type === "pg" || property?.type === "rk" || property?.type === "flat") && property?.floorDetails && property.floorDetails.length > 0 && (
            <>
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Room 360° Tours</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Room
                  </label>
                  <select
                    value={selectedRoom?.id || ''}
                    onChange={(e) => {
                      const roomId = e.target.value;
                      if (roomId) {
                        // Find the floor and room
                        const floor = property.floorDetails.find(f => 
                          f.rooms.some(r => r.id === parseInt(roomId))
                        );
                        const room = floor?.rooms.find(r => r.id === parseInt(roomId));
                        if (room) {
                          setSelectedRoom({ ...room, floor_id: floor.id });
                        }
                      } else {
                        setSelectedRoom(null);
                      }
                    }}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select a room</option>
                    {property.floorDetails?.map((floor) => (
                      <optgroup key={floor.id} label={`Floor ${floor.floorNumber}`}>
                        {floor.rooms?.map((room) => (
                          <option key={room.id} value={room.id}>
                            Room {room.roomNumber} - {room.capacity === room.occupied ? 'Occupied' : 'Available'}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {selectedRoom ? (
                  <PanoramaViewer roomId={selectedRoom.id} className="w-full h-[500px] rounded-lg" />
                ) : (
                  <div className="w-full h-[500px] rounded-lg bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-600">Please select a room to view its 360° tour</p>
                  </div>
                )}
              </div>
            </>
          )}
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
