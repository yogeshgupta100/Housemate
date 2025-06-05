import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { Backendurl } from "../../App";
import {
  Home,
  IndianRupee,
  Phone,
  Mail,
  Building,
  Upload,
  Save,
  X,
  CodeSquare,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const PROPERTY_TYPES = {
  rent: [
    "house",
    "apartment",
    "office",
    "villa",
    "pg",
    "flat",
    "rk",
    "commercial",
  ],
  sale: [
    "house",
    "apartment",
    "office",
    "villa",
    "flat",
    "commercial",
    "residential plot",
    "commercial plot",
  ],
};

const LISTING_TYPES = ["rent", "sale"];
const AVAILABILITY_TYPES = ["rent", "sale", "buy"];
const LEASE_PERIODS = [
  "3 months",
  "6 months",
  "12 months",
  "18 months",
  "24 months",
];
const AMENITIES = [
  "Food",
  "Microwave",
  "Induction",
  "Television",
  "Refrigerator",
  "Laundry",
  "Bedsheets",
  "Kitchen essentials",
  "Power Backup",
  "Gyser",
  "Chimney",
  "Washing Machine",
  "Table Tennis",
  "Play Area",
  "Lake View",
  "Fireplace",
  "Central Heating and Air Conditioning",
  "Dock",
  "Pool",
  "Garage",
  "Garden",
  "Gym",
  "Security System",
  "Master Bathroom",
  "Guest Bathroom",
  "Home Theater",
  "Exercise Room/Gym",
  "Four Wheeler Parking",
  "Two Wheeler Parking",
  "High-Speed Internet Ready",
];
const PROPERTY_CONDITIONS = ["new", "good", "average", "needs_repair"];
const PROPERTY_STATUSES = ["ready_to_move", "under_construction", "renovated"];

const DIAL_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+86", country: "China" },
  { code: "+81", country: "Japan" },
  { code: "+82", country: "South Korea" },
  { code: "+65", country: "Singapore" },
  { code: "+971", country: "UAE" },
  { code: "+33", country: "France" },
  { code: "+49", country: "Germany" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+7", country: "Russia" },
  { code: "+55", country: "Brazil" },
  { code: "+52", country: "Mexico" },
  { code: "+20", country: "Egypt" },
  { code: "+27", country: "South Africa" },
  { code: "+60", country: "Malaysia" },
  { code: "+66", country: "Thailand" },
];

const PropertyListingForm = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft");
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    price: "",
    deposit: "",
    location: "",
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
    description: "",
    beds: "",
    baths: "",
    sqft: "",
    phone: "",
    dialCode: "+91",
    availability: {
      status: "Available",
      availableFrom: "",
      minLeasePeriod: "12 months",
    },
    amenities: [],
    images: [],
    listingType: "rent",
    propertyAge: "",
    propertyCondition: "",
    propertyStatus: "",
  });

  const [previewUrls, setPreviewUrls] = useState([]);
  const [calculatedDeposit, setCalculatedDeposit] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentType, setCurrentType] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState([]);

  const locationInputRef = useRef(null);

  const [floorDetails, setFloorDetails] = useState([
    {
      floorNumber: 1,
      rooms: [
        {
          roomNumber: 1,
          capacity: 1,
          occupied: 0,
          rent_amount: 0,
        },
      ],
    },
  ]);

  const validateField = (name, value) => {
    switch (name) {
      case "price" && !["pg", "rk" , "flat"].includes(currentType):
        return value <= 0 ? "Price must be greater than 0" : "";
      case "beds" && !["pg", "rk" , "flat"].includes(currentType):
      case "baths" && !["pg", "rk" , "flat"].includes(currentType):
        return value < 0 && value !== ""
          ? "Cannot be negative"
          : !Number.isInteger(Number(value))
          ? "Must be a whole number"
          : "";
      case "sqft" && !["pg", "rk" , "flat"].includes(currentType):
        return value <= 0 ? "Area must be greater than 0" : "";
      case "title":
        return value.length < 5 ? "Title must be at least 5 characters" : "";
      case "phone":
        return !/^\d{10}$/.test(value)
          ? "Enter valid 10-digit phone number"
          : "";
      default:
        return "";
    }
  };

  useEffect(() => {
    if (!locationInputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      locationInputRef.current,
      {
        componentRestrictions: { country: "IN" },
        fields: ["address_components", "geometry", "formatted_address"],
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry) {
        toast.error("Please select a location from the suggestions");
        return;
      }

      const addressComponents = {
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      };

      place.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes("street_number") || types.includes("route")) {
          addressComponents.street += component.long_name + " ";
        }
        if (types.includes("locality")) {
          addressComponents.city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          addressComponents.state = component.long_name;
        }
        if (types.includes("postal_code")) {
          addressComponents.pincode = component.long_name;
        }
      });

      setFormData((prev) => ({
        ...prev,
        location: place.formatted_address,
        coordinates: {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        },
        address: {
          street: addressComponents.street.trim(),
          city: addressComponents.city,
          state: addressComponents.state,
          pincode: addressComponents.pincode,
          country: "India",
        },
      }));
    });

    return () => {
      // Cleanup
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (user?.userType === "corporate") {
      setError(
        "Corporate users cannot list properties. Please contact support for assistance."
      );
      return;
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        contact: {
          name: user.name || "",
          phone: user.phone || "",
          email: user.email || "",
        },
      }));
    }

    if (editId) {
      loadPropertyForEdit(editId);
    } else if (draftId) {
      loadDraft(draftId);
    }
  }, [isLoggedIn, user, navigate, editId, draftId]);

  const loadPropertyForEdit = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${Backendurl}/api/properties/${id}`);
      if (response.data.success) {
        const propertyData = response.data.property;
        
        // Set floor details from the API response
        if (propertyData.floorDetails) {
          setFloorDetails(propertyData.floorDetails.map(floor => ({
            floorNumber: floor.floorNumber,
            rooms: floor.rooms.map(room => ({
              roomNumber: room.roomNumber,
              capacity: room.capacity,
              occupied: room.occupied,
              rent_amount: room.rent,
              availableFrom: room.availableFrom,
              hasBalcony: room.hasBalcony
            }))
          })));
        }

        setFormData({
          title: propertyData.title || '',
          subtitle: propertyData.subtitle || '',
          description: propertyData.description || '',
          listingType: propertyData.listing_type || 'rent',
          type: propertyData.type || '',
          price: propertyData.price || '',
          rentType: propertyData.rent_type || 'monthly',
          deposit: calculatedDeposit || '',
          propertyAge: propertyData.property_age || '',
          propertyCondition: propertyData.property_condition || '',
          propertyStatus: propertyData.property_status || '',
          availability: propertyData.availability || { status: 'Available', availableFrom: null, minLeasePeriod: '12 months' },
          location: propertyData.location || '',
          phone: propertyData.phone || '',
          region: propertyData.region || '',
          latitude: propertyData.latitude || '',
          longitude: propertyData.longitude || '',
          street: propertyData.street || '',
          city: propertyData.city || '',
          state: propertyData.state || '',
          pincode: propertyData.pincode || '',
          country: propertyData.country || '',
          floorArea: propertyData.floor_area || '',
          sqft: propertyData.sqft || '',
          floorNo: propertyData.floor_no || '',
          totalFloors: propertyData.total_floors || '',
          beds: propertyData.beds || 0,
          baths: propertyData.baths || 0,
          furnishing: propertyData.furnishing || 'Unfurnished',
          amenities: propertyData.amenities || [],
          balcony: propertyData.balcony || false,
          centralAc: propertyData.central_ac || false,
          powerBackup: propertyData.power_backup || false,
          parking: propertyData.parking || false,
          security: propertyData.security || false,
          swimmingPool: propertyData.swimming_pool || false,
          gym: propertyData.gym || false,
          garden: propertyData.garden || false,
          lift: propertyData.lift || false,
          images: propertyData.images || [],
          videos: propertyData.videos || [],
          status: propertyData.status || 'Active',
          featured: propertyData.featured || false
        });

        // Set preview URLs for images
        setPreviewUrls(propertyData.images || []);
      }
    } catch (error) {
      console.error('Error loading property:', error);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${Backendurl}/api/properties/drafts/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setFormData(response.data.draft);
      toast.info("Draft loaded successfully");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "An error occurred. Please try again.";
      console.error("Error loading draft:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.listingType === "rent" && formData.price && formData.type) {
      const multipliers = {
        house: 2,
        apartment: 3,
        office: 3,
        villa: 3,
        commercial: 3,
        flat: 2,
        pg: 1,
        rk: 1,
      };
      setCalculatedDeposit(formData.price * (multipliers[formData.type] || 2));
    }
  }, [formData.price, formData.type, formData.listingType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "type") {
      setCurrentType(value);
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      if (type === "number") {
        const numValue = Number(value);
        if (numValue < 0) {
          return; 
        }
        if (name === "beds" || name === "baths") {
          if (!Number.isInteger(numValue)) {
            return;
          }
        }
      }

      if (name === "listingType") {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          type: "",
          propertyAge: value === "sale" ? "" : undefined,
          propertyCondition: value === "sale" ? "" : undefined,
          propertyStatus: value === "sale" ? "" : undefined,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        }));
      }

      const error = validateField(name, value);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setImageUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("pdf", file);

        const response = await axios.post(
          `${Backendurl}/api/pg/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          uploadedUrls.push(response.data.data.url);
        }
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      setPreviewUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload some images");
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + (formData.videos?.length || 0) > 3) {
      toast.error('You can upload up to 3 videos.');
      return;
    }
    setVideoUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 50MB.`);
          continue;
        }
        if (!file.type.startsWith('video/')) {
          toast.error(`${file.name} is not a video file.`);
          continue;
        }
        const formData = new FormData();
        formData.append('pdf', file); // same as images
        const response = await axios.post(
          `${Backendurl}/api/pg/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (response.data.success) {
          uploadedUrls.push(response.data.data.url);
        }
      }
      setFormData((prev) => ({
        ...prev,
        videos: [...(prev.videos || []), ...uploadedUrls],
      }));
      setVideoPreviewUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading videos:', error);
      toast.error('Failed to upload some videos');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleRemoveVideo = (index) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
    setVideoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!isLoggedIn) {
      toast.info("Please login to save a draft");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to save a draft");
        navigate("/login");
        return;
      }

      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "images") {
          value.forEach((file) => {
            formDataToSend.append("images", file);
          });
        } else if (typeof value === "object") {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      });

      const url = draftId
        ? `${Backendurl}/api/properties/drafts/${draftId}`
        : `${Backendurl}/api/properties/drafts`;

      const method = draftId ? "put" : "post";

      const response = await axios[method](url, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success(
          draftId ? "Draft updated successfully!" : "Draft saved successfully!"
        );
        navigate("/dashboard/draft-properties");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setError(error.response?.data?.message || "Failed to save draft");
      toast.error(error.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleFloorDetailsChange = (floorIndex, field, value) => {
    setFloorDetails((prev) => {
      const newDetails = [...prev];
      if (field === "floorNumber") {
        newDetails[floorIndex].floorNumber = value;
      }
      return newDetails;
    });
  };

  const handleRoomDetailsChange = (floorIndex, roomIndex, field, value) => {
    setFloorDetails((prev) => {
      const newDetails = [...prev];
      if (field === "roomNumber") {
        newDetails[floorIndex].rooms[roomIndex].roomNumber = value;
      } else if (field === "capacity") {
        newDetails[floorIndex].rooms[roomIndex].capacity = value;
        if (newDetails[floorIndex].rooms[roomIndex].occupied > value) {
          newDetails[floorIndex].rooms[roomIndex].occupied = value;
        }
      } else if (field === "occupied") {
        const maxOccupied = newDetails[floorIndex].rooms[roomIndex].capacity;
        newDetails[floorIndex].rooms[roomIndex].occupied = Math.min(
          value,
          maxOccupied
        );
      } else if (field === "rent_amount") {
        newDetails[floorIndex].rooms[roomIndex].rent_amount = value;
      } else if (field === "availableFrom") {
        newDetails[floorIndex].rooms[roomIndex].availableFrom = value;
      } else if (field === "hasBalcony") {
        newDetails[floorIndex].rooms[roomIndex].hasBalcony = value;
      }
      return newDetails;
    });
  };

  const addFloor = () => {
    setFloorDetails((prev) => [
      ...prev,
      {
        floorNumber: prev.length + 1,
        rooms: [
          {
            roomNumber: 1,
            capacity: 1,
            occupied: 0,
            rent_amount: 0,
          },
        ],
      },
    ]);
  };

  const removeFloor = (floorIndex) => {
    setFloorDetails((prev) => prev.filter((_, index) => index !== floorIndex));
  };

  const addRoom = (floorIndex) => {
    setFloorDetails((prev) => {
      const newDetails = [...prev];
      const currentFloor = newDetails[floorIndex];
      const nextRoomNumber = currentFloor.rooms.length + 1;
      const updatedRooms = [
        ...currentFloor.rooms,
        {
          roomNumber: nextRoomNumber,
          capacity: 1,
          occupied: 0,
          rent_amount: 0,
        },
      ];
      newDetails[floorIndex] = {
        ...currentFloor,
        rooms: updatedRooms,
      };
      return newDetails;
    });
  };

  const removeRoom = (floorIndex, roomIndex) => {
    setFloorDetails((prev) => {
      const newDetails = [...prev];
      newDetails[floorIndex].rooms = newDetails[floorIndex].rooms.filter(
        (_, index) => index !== roomIndex
      );
      return newDetails;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSubmit = { ...formData };

      if (formData.images && formData.images.length > 0) {
        formDataToSubmit.images = formData.images.map(image => {
          if (typeof image === 'string') {
            return image;
          }
          return image;
        });
      }

      if (formData.amenities) {
        if (Array.isArray(formData.amenities)) {
          formDataToSubmit.amenities = formData.amenities;
        } else if (typeof formData.amenities === 'string') {
          try {
            const parsed = JSON.parse(formData.amenities);
            formDataToSubmit.amenities = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            formDataToSubmit.amenities = formData.amenities.split(',').map(item => item.trim());
          }
        }
      }

      if (formData.availability) {
        formDataToSubmit.availability = typeof formData.availability === 'string' 
          ? JSON.parse(formData.availability) 
          : formData.availability;
      }

      console.log({formDataToSubmit});
      let response;
      if (editId) {
        response = await axios.put(
          `${Backendurl}/api/properties/${editId}`,
          formDataToSubmit,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      } else {
        response = await axios.post(
          `${Backendurl}/api/properties`,
          formDataToSubmit,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }

      if (response.data.success) {
        setSuccess(true);
        toast.success(editId ? "Property updated successfully!" : "Property listed successfully!");
        navigate('/customer-panel/properties');
      } else {
        setError(response.data.message || "Failed to save property");
      }
    } catch (err) {
      console.error("Error saving property:", err);
      setError(err.response?.data?.message || "Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const inputStyles = {
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    lineHeight: "1.5",
    borderRadius: "0.5rem",
    width: "100%",
    transition: "all 0.2s",
    outline: "none",
  };

  const textareaStyles = {
    ...inputStyles,
    minHeight: "120px",
    resize: "vertical",
  };

  const getUserSpecificFields = () => {
    if (!user) return null;

    switch (user.userType) {
      case "dealer":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Dealer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  License Number
                </label>
                <input
                  type="text"
                  name="dealerLicense"
                  value={formData.dealerLicense || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  name="dealerExperience"
                  value={formData.dealerExperience || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        );
      case "admin":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Admin Controls
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Property Status
                </label>
                <select
                  name="status"
                  value={formData.status || "active"}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Verification Status
                </label>
                <select
                  name="verified"
                  value={formData.verified || false}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={true}>Verified</option>
                  <option value={false}>Unverified</option>
                </select>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  if (user?.userType === "corporate") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">
            Access Restricted
          </h2>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 pt-24 pb-12"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {editId ? "Edit Property" : "List Your Property"}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {editId
              ? "Update your property details below"
              : "Fill in the details below to list your property. All fields marked with * are required."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Property Classification
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What would you like to do with your property? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {LISTING_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: { name: "listingType", value: type },
                        })
                      }
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.listingType === type
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                      }`}
                    >
                      <div className="font-medium text-lg mb-1">
                        {type === "rent" ? "For Rent" : "For Sale"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {type === "rent"
                          ? "List your property for rental"
                          : "List your property for sale"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.listingType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Property Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {PROPERTY_TYPES[formData.listingType].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          handleChange({
                            target: { name: "type", value: type },
                          })
                        }
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          formData.type === type
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-blue-200"
                        }`}
                      >
                        {type
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Basic Information
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    style={inputStyles}
                    className={`border ${
                      fieldErrors.title ? "border-red-300" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter a descriptive title"
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                {formData.listingType === "rent" &&
                  !["pg", "rk" , "flat"].includes(formData.type) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.listingType === "rent"
                          ? "Monthly Rent *"
                          : "Selling Price *"}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IndianRupee className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          min="0"
                          style={{
                            padding: "0.75rem 2rem",
                            fontSize: "1rem",
                            lineHeight: "1.5",
                            borderRadius: "0.5rem",
                            width: "100%",
                            transition: "all 0.2s",
                            outline: "none",
                          }}
                          className={`pl-10 border ${
                            fieldErrors.price
                              ? "border-red-300"
                              : "border-gray-300"
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Enter amount"
                        />
                      </div>
                      {fieldErrors.price && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.price}
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {formData.listingType === "rent" && formData.price > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">
                      Security Deposit
                    </span>
                    <span className="text-lg font-semibold text-blue-700">
                      ₹{calculatedDeposit.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Security deposit is automatically calculated based on
                    property type
                  </p>
                </div>
              )}
            </div>
          </div>

          {formData.listingType === "rent" &&
            !["pg", "rk" , "flat"].includes(formData.type) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                  Availability Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available From *
                    </label>
                    <input
                      type="date"
                      name="availability.availableFrom"
                      value={
                        formData.availability.availableFrom
                          ? new Date(formData.availability.availableFrom)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      max={
                        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                          .toISOString()
                          .split("T")[0]
                      }
                      style={inputStyles}
                      className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Lease Period *
                    </label>
                    <select
                      name="availability.minLeasePeriod"
                      value={formData.availability.minLeasePeriod}
                      onChange={handleChange}
                      style={inputStyles}
                      className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {LEASE_PERIODS.map((period) => (
                        <option key={period} value={period}>
                          {period}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

          {formData.listingType === "sale" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                Sale-Specific Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Age (years) *
                  </label>
                  <input
                    type="number"
                    name="propertyAge"
                    value={formData.propertyAge}
                    onChange={handleChange}
                    min="0"
                    style={inputStyles}
                    className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter property age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Condition *
                  </label>
                  <select
                    name="propertyCondition"
                    value={formData.propertyCondition}
                    onChange={handleChange}
                    style={inputStyles}
                    className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select condition</option>
                    {PROPERTY_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Status *
                  </label>
                  <select
                    name="propertyStatus"
                    value={formData.propertyStatus}
                    onChange={handleChange}
                    style={inputStyles}
                    className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select status</option>
                    {PROPERTY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Location Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Location *
                </label>
                <input
                  ref={locationInputRef}
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={inputStyles}
                  className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search for location"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Start typing and select from the dropdown suggestions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Property Details
            </h2>

            <div className="space-y-6">
              <div
                className={`grid grid-cols-1 ${
                  formData.type?.includes("plot")
                    ? "md:grid-cols-1"
                    : "md:grid-cols-3"
                } gap-6`}
              >
                {/* Area Field */}
                {formData.listingType === "rent" &&
                  !["pg", "rk" , "flat"].includes(formData.type) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area (sq ft) *
                      </label>
                      <input
                        type="number"
                        name="sqft"
                        value={formData.sqft}
                        onChange={handleChange}
                        min="0"
                        style={inputStyles}
                        className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                {!formData.type?.includes("plot") &&
                  !["pg", "rk" , "flat"].includes(formData.type) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bedrooms *
                        </label>
                        <input
                          type="number"
                          name="beds"
                          value={formData.beds}
                          onChange={handleChange}
                          min="0"
                          style={inputStyles}
                          className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bathrooms *
                        </label>
                        <input
                          type="number"
                          name="baths"
                          value={formData.baths}
                          onChange={handleChange}
                          min="0"
                          style={inputStyles}
                          className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <div className="flex gap-4">
                  <select
                    name="dialCode"
                    value={formData.dialCode}
                    onChange={handleChange}
                    className="w-[180px] px-3 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DIAL_CODES.map(({ code, country }) => (
                      <option key={code} value={code}>
                        {code} {country}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${
                        fieldErrors.phone ? "border-red-300" : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter phone number"
                      maxLength={15}
                    />
                    {fieldErrors.phone && (
                      <p className="absolute -bottom-6 left-0 text-sm text-red-600">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  style={textareaStyles}
                  className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your property..."
                />
              </div>
            </div>
          </div>

          {formData.listingType === "rent" &&
            ["pg", "rk", "flat"].includes(formData.type) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                  Floor & Room Details
                </h2>

                <div className="space-y-6">
                  {floorDetails.map((floor, floorIndex) => (
                    <div key={floorIndex} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">
                          Floor {floor.floorNumber}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addRoom(floorIndex)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Add Room
                          </button>
                          {floorDetails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFloor(floorIndex)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Remove Floor
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {floor.rooms.map((room, roomIndex) => (
                          <div
                            key={roomIndex}
                            className="p-3 bg-gray-50 rounded mb-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Room Number
                                </label>
                                <input
                                  type="number"
                                  value={room.roomNumber}
                                  onChange={(e) =>
                                    handleRoomDetailsChange(
                                      floorIndex,
                                      roomIndex,
                                      "roomNumber",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  min="1"
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              {formData.type !== "rk" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Capacity
                                  </label>
                                  <input
                                    type="number"
                                    value={room.capacity}
                                    onChange={(e) =>
                                      handleRoomDetailsChange(
                                        floorIndex,
                                        roomIndex,
                                        "capacity",
                                        parseInt(e.target.value)
                                      )
                                    }
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              )}
                              {formData.type !== "rk" && <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Currently Occupied
                                </label>
                                <input
                                  type="number"
                                  value={room.occupied}
                                  onChange={(e) =>
                                    handleRoomDetailsChange(
                                      floorIndex,
                                      roomIndex,
                                      "occupied",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  min="0"
                                  max={room.capacity}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Max: {room.capacity}
                                </p>
                              </div>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Rent Amount (₹)
                                </label>
                                <input
                                  type="number"
                                  value={room.rent_amount || ""}
                                  onChange={(e) =>
                                    handleRoomDetailsChange(
                                      floorIndex,
                                      roomIndex,
                                      "rent_amount",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  min="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Enter rent amount"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Available From
                                </label>
                                <input
                                  type="date"
                                  value={room.availableFrom || ""}
                                  onChange={(e) =>
                                    handleRoomDetailsChange(
                                      floorIndex,
                                      roomIndex,
                                      "availableFrom",
                                      e.target.value
                                    )
                                  }
                                  min={new Date().toISOString().split("T")[0]}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            <div className="flex items-center mt-4">
                              <input
                                type="checkbox"
                                id={`balcony-${floorIndex}-${roomIndex}`}
                                checked={room.hasBalcony || false}
                                onChange={(e) =>
                                  handleRoomDetailsChange(
                                    floorIndex,
                                    roomIndex,
                                    "hasBalcony",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`balcony-${floorIndex}-${roomIndex}`}
                                className="ml-2 block text-sm text-gray-700"
                              >
                                Has Balcony
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addFloor}
                    className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Add Floor
                  </button>
                </div>
              </div>
            )}

          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Amenities & Features
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityChange(amenity)}
                  className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                    formData.amenities.includes(amenity)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => {}}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{amenity}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Property Images
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-video rounded-lg overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <label className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload Images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                You can upload up to 10 images. Each image should be less than
                5MB.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Property Videos
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative group aspect-video rounded-lg overflow-hidden">
                    <video src={url} controls className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <label className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload Videos</span>
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={videoUploading || (formData.videos?.length || 0) >= 3}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                You can upload up to 3 videos. Each video should be less than 50MB.
              </p>
              {videoUploading && <p className="text-blue-600">Uploading videos...</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading || imageUploading || videoUploading}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading || imageUploading || videoUploading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : imageUploading ? "Uploading Images..." : videoUploading ? "Uploading Videos..." : "List Property"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default PropertyListingForm;
