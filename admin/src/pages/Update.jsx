import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendurl } from "../App";
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
  BedDouble,
  Bath,
  Maximize,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

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
    "flat",
    "builder floor",
    "house",
    "office",
    "commercial plot",
    "residential plot",
    "commercial",
    "apartment",
    "villa",
  ],
};

const LISTING_TYPES = ["rent", "sale"];
const AVAILABILITY_TYPES = ["rent", "sale", "buy"];
const PG_TYPES = ["boys", "girls", "co-living"];
const SHARING_TYPES = ["single", "double", "triple", "quad"];
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
  // Sale-specific amenities
  "Club House",
  "Temple",
  "Society Shops",
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

// Separate amenities for rent and sale
const RENT_AMENITIES = [
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

const SALE_AMENITIES = [
  "Microwave",
  "Television",
  "Refrigerator",
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
  "Club House",
  "Temple",
  "Society Shops",
];

const Update = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
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
    pgType: "",
    sharingType: "",
    hasBalcony: false,
    status: "active",
    verification_status: "unverified",
    furnishing: "",
    central_ac: false,
    power_backup: false,
    parking: false,
    security: false,
    lift: false,
    videos: [],
    officeArea: "",
    officeFloors: "",
    officeCapacity: "",
    officeCabins: "",
    meetingRooms: "",
    headCabins: "",
    officeAmenities: [],
    plotArea: "",
    nearbyArea: "",
    underCommittee: false,
    passedBuildingLand: false,
    estimatedRentalIncome: "",
    builderFloors: "",
    houseArea: "",
    houseBedrooms: "",
    houseBathrooms: "",
    houseBalcony: "",
    houseParking: "",
    houseAmenities: [],
    houseLocation: "",
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
          availableFrom: "",
          hasBalcony: false,
        },
      ],
    },
  ]);

  const validateField = (name, value) => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Property title is required";
        if (value.length < 10) return "Title must be at least 10 characters";
        if (value.length > 100) return "Title must be less than 100 characters";
        break;
      case "price":
        if (!value) return "Price is required";
        if (isNaN(value) || value <= 0)
          return "Price must be a positive number";
        break;
      case "deposit":
        if (formData.listingType === "rent" && !value)
          return "Deposit is required for rental properties";
        if (value && (isNaN(value) || value < 0))
          return "Deposit must be a non-negative number";
        break;
      case "type":
        if (!value) return "Property type is required";
        break;
      case "location":
        if (!value.trim()) return "Location is required";
        break;
      case "description":
        if (!value.trim()) return "Description is required";
        if (value.length < 50)
          return "Description must be at least 50 characters";
        break;
      case "beds":
        if (value && (isNaN(value) || value < 0))
          return "Number of beds must be a non-negative number";
        break;
      case "baths":
        if (value && (isNaN(value) || value < 0))
          return "Number of baths must be a non-negative number";
        break;
      case "sqft":
        if (value && (isNaN(value) || value <= 0))
          return "Square footage must be a positive number";
        break;
      case "phone":
        if (value && !/^[0-9]{10}$/.test(value.replace(/\D/g, ""))) {
          return "Please enter a valid 10-digit phone number";
        }
        break;
      case "availability.availableFrom":
        if (formData.listingType === "rent" && !value) {
          return "Available from date is required for rental properties";
        }
        break;
      case "propertyAge":
        if (formData.listingType === "sale" && !value) {
          return "Property age is required for sale properties";
        }
        if (value && (isNaN(value) || value < 0)) {
          return "Property age must be a non-negative number";
        }
        break;
      case "propertyCondition":
        if (formData.listingType === "sale" && !value) {
          return "Property condition is required for sale properties";
        }
        break;
      case "propertyStatus":
        if (formData.listingType === "sale" && !value) {
          return "Property status is required for sale properties";
        }
        break;
    }
    return null;
  };

  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
      } else {
        setTimeout(checkGoogleMapsLoaded, 100);
      }
    };
    checkGoogleMapsLoaded();
  }, []);

  useEffect(() => {
    if (!locationInputRef.current || !isGoogleMapsLoaded) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          componentRestrictions: { country: "IN" },
          fields: ["address_components", "geometry", "formatted_address"],
          types: ["geocode", "establishment"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
          toast.error("Please select a location from the suggestions");
          return;
        }

        let street = "";
        let city = "";
        let state = "";
        let pincode = "";
        let country = "";
        let region = "";

        place.address_components.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            street = component.long_name + " " + street;
          }
          if (types.includes("route")) {
            street += component.long_name;
          }
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.long_name;
          }
          if (types.includes("postal_code")) {
            pincode = component.long_name;
          }
          if (types.includes("country")) {
            country = component.long_name;
          }
          if (types.includes("sublocality_level_1")) {
            region = component.long_name;
          }
          if (types.includes("administrative_area_level_2") && !region) {
            region = component.long_name;
          }
        });

        setFormData((prev) => ({
          ...prev,
          location: place.formatted_address,
          region,
          coordinates: {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          },
          address: {
            street: street.trim(),
            city,
            state,
            pincode,
            country,
          },
        }));
      });

      return () => {
        if (autocomplete) {
          google.maps.event.clearInstanceListeners(autocomplete);
        }
      };
    } catch (error) {
      console.error("Error initializing Google Maps Autocomplete:", error);
      toast.error(
        "Error initializing location search. Please refresh the page."
      );
    }
  }, [isGoogleMapsLoaded]);

  const loadPropertyForEdit = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendurl}/api/properties/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        const propertyData = response.data.property;

        // Format the data to match form structure
        const formattedData = {
          ...propertyData,
          dialCode: "+91",
          pgType: propertyData.pg_type,
          listingType: propertyData.listing_type,
          availability: {
            status: propertyData.availability?.status || "Available",
            availableFrom: propertyData.availability?.availableFrom || "",
            minLeasePeriod:
              propertyData.availability?.minLeasePeriod || "12 months",
          },
          coordinates: {
            latitude: parseFloat(propertyData.latitude) || 0,
            longitude: parseFloat(propertyData.longitude) || 0,
          },
          address: {
            street: propertyData.street || "",
            city: propertyData.city || "",
            state: propertyData.state || "",
            pincode: propertyData.pincode || "",
            country: propertyData.country || "India",
          },
          hasBalcony: propertyData.balcony || false,
          central_ac: propertyData.central_ac || false,
          power_backup: propertyData.power_backup || false,
          parking: propertyData.parking || false,
          security: propertyData.security || false,
          lift: propertyData.lift || false,
          beds: propertyData.beds || 0,
          baths: propertyData.baths || 0,
          sqft: propertyData.sqft || 0,
          price: propertyData.price || "",
          deposit: propertyData.deposit || "",
          title: propertyData.title || "",
          description: propertyData.description || "",
          location: propertyData.location || "",
          phone: propertyData.phone || "",
          furnishing: propertyData.furnishing || "",
          propertyAge: propertyData.property_age || "",
          propertyCondition: propertyData.property_condition || "",
          propertyStatus: propertyData.property_status || "",
          status: propertyData.status?.toLowerCase() || "active",
          verification_status: propertyData.verification_status || "unverified",
        };

        setFormData(formattedData);
        setCurrentType(formattedData.type);

        // Set preview URLs for images and videos
        if (formattedData.images) {
          setPreviewUrls(formattedData.images);
        }
        if (formattedData.videos) {
          setVideoPreviewUrls(formattedData.videos);
        }

        // Set floor details if it's a PG property
        if (formattedData.type === "pg" && propertyData.floorDetails) {
          setFloorDetails(
            propertyData.floorDetails.map((floor) => ({
              floorNumber: floor.floorNumber,
              rooms: floor.rooms.map((room) => ({
                roomNumber: room.roomNumber,
                capacity: room.capacity,
                occupied: room.occupied,
                rent: room.rent,
                availableFrom: room.availableFrom,
                hasBalcony: room.hasBalcony,
              })),
            }))
          );
        }
      } else {
        toast.error(response.data.message || "Failed to load property data");
      }
    } catch (error) {
      console.error("Error loading property:", error);
      toast.error(
        error.response?.data?.message || "Failed to load property data"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${backendurl}/api/properties/draft/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const draftData = response.data.data;

        // Format the data to match form structure
        const formattedData = {
          ...draftData,
          dialCode: draftData.dial_code || "+91",
          pgType: draftData.pg_type,
          availability: {
            status: draftData.availability?.status || "Available",
            availableFrom: draftData.availability?.availableFrom || "",
            minLeasePeriod:
              draftData.availability?.minLeasePeriod || "12 months",
          },
          coordinates: draftData.coordinates || {
            latitude: 0,
            longitude: 0,
          },
          address: draftData.address || {
            street: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
          },
        };

        setFormData(formattedData);
        setCurrentType(formattedData.type);

        // Set preview URLs for images and videos
        if (formattedData.images) {
          setPreviewUrls(formattedData.images);
        }
        if (formattedData.videos) {
          setVideoPreviewUrls(formattedData.videos);
        }

        // Set floor details if it's a PG property
        if (formattedData.type === "pg" && formattedData.floorDetails) {
          setFloorDetails(
            formattedData.floorDetails.map((floor) => ({
              floorNumber: floor.floorNumber,
              rooms: floor.rooms.map((room) => ({
                roomNumber: room.roomNumber,
                capacity: room.capacity,
                occupied: room.occupied,
                rent: room.rent_amount,
                availableFrom: room.availableFrom,
                hasBalcony: room.hasBalcony,
              })),
            }))
          );
        }
      } else {
        toast.error(response.data.message || "Failed to load draft data");
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast.error(error.response?.data?.message || "Failed to load draft data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminAuth = () => {
      const token = localStorage.getItem("token");
      const adminStatus = localStorage.getItem("isAdmin");

      if (!token || adminStatus !== "true") {
        localStorage.removeItem("token");
        localStorage.removeItem("isAdmin");
        navigate("/login");
        return false;
      }

      try {
        const tokenData = JSON.parse(atob(token.split(".")[1]));
        if (tokenData.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          localStorage.removeItem("isAdmin");
          navigate("/login");
          return false;
        }
        return true;
      } catch (error) {
        console.error("Error verifying token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("isAdmin");
        navigate("/login");
        return false;
      }
    };

    const isAuthenticated = checkAdminAuth();
    setIsAdmin(isAuthenticated);

    if (isAuthenticated) {
      console.log("Route ID:", id);
      console.log("Draft ID:", draftId);

      if (id) {
        console.log("Loading property for edit:", id);
        loadPropertyForEdit(id);
      } else if (draftId) {
        console.log("Loading draft:", draftId);
        loadDraft(draftId);
      }
    }
  }, [id, draftId, navigate]);

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
          `${backendurl}/api/pg/upload`,
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
      toast.error("You can upload up to 3 videos.");
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
        if (!file.type.startsWith("video/")) {
          toast.error(`${file.name} is not a video file.`);
          continue;
        }
        const formData = new FormData();
        formData.append("pdf", file);
        const response = await axios.post(
          `${backendurl}/api/pg/upload`,
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
        videos: [...(prev.videos || []), ...uploadedUrls],
      }));
      setVideoPreviewUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("Error uploading videos:", error);
      toast.error("Failed to upload some videos");
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

  const STATUS_TO_DB_MAP = {
    active: "available",
    sold: "sold",
    pending: "pending",
    inactive: "unavailable",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSubmit = { ...formData };

      // Add updated_by field with current user ID
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      formDataToSubmit.updated_by = currentUser.id || currentUser.user_id;

      // Format data based on listing type
      if (formDataToSubmit.listingType === "sale") {
        formDataToSubmit.rent_type = null;
        formDataToSubmit.deposit = null;
        formDataToSubmit.availability = {
          status: "Available",
          availableFrom: null,
          minLeasePeriod: null,
        };
      }

      // Ensure property status is set to a valid value
      if (formDataToSubmit.type === "pg") {
        formDataToSubmit.propertyStatus = "ready_to_move";
        formDataToSubmit.pg_type = formDataToSubmit.pgType;
      } else if (!formDataToSubmit.propertyStatus) {
        formDataToSubmit.propertyStatus = "ready_to_move";
      }

      // Add floor details and PG specific fields for PG properties
      if (formDataToSubmit.type === "pg") {
        formDataToSubmit.floorDetails = floorDetails.map((floor) => ({
          floorNumber: floor.floorNumber,
          rooms: floor.rooms.map((room) => ({
            roomNumber: room.roomNumber,
            capacity: room.capacity,
            occupied: room.occupied,
            rent: room.rent_amount,
            availableFrom: room.availableFrom,
            hasBalcony: room.hasBalcony,
          })),
        }));
      }

      // Ensure phone and dial code are included
      formDataToSubmit.phone = formDataToSubmit.phone;
      formDataToSubmit.dial_code = formDataToSubmit.dialCode;
      formDataToSubmit.status = STATUS_TO_DB_MAP[formDataToSubmit.status];

      if (formData.images && formData.images.length > 0) {
        formDataToSubmit.images = formData.images.map((image) => {
          if (typeof image === "string") {
            return image;
          }
          return image;
        });
      }

      if (formData.amenities) {
        if (Array.isArray(formData.amenities)) {
          formDataToSubmit.amenities = formData.amenities;
        } else if (typeof formData.amenities === "string") {
          try {
            const parsed = JSON.parse(formData.amenities);
            formDataToSubmit.amenities = Array.isArray(parsed)
              ? parsed
              : [parsed];
          } catch (e) {
            formDataToSubmit.amenities = formData.amenities
              .split(",")
              .map((item) => item.trim());
          }
        }
      }

      let response;
      if (id) {
        response = await axios.put(
          `${backendurl}/api/properties/${id}`,
          formDataToSubmit,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        try {
          response = await axios.post(
            `${backendurl}/api/properties`,
            formDataToSubmit,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to save property"
          );
        }
      }

      if (response.data.success) {
        setSuccess(true);
        toast.success(response.data.message);
        navigate("/customer-panel/properties");
      } else {
        setError(response.data.message || "Failed to save property");
        toast.error(response.data.message || "Failed to save property");
      }
    } catch (err) {
      console.error("Error saving property:", err);

      // Handle specific foreign key constraint errors
      if (err.response?.data?.message?.includes("foreign key constraint")) {
        const errorMessage =
          "Cannot update property because some rooms have pending availability requests. Please resolve these requests first or contact support.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage =
          err.response?.data?.message || "Failed to save property";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: (prev.amenities || []).includes(amenity)
        ? (prev.amenities || []).filter((item) => item !== amenity)
        : [...(prev.amenities || []), amenity],
    }));
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError(null);

    try {
      const formDataToSubmit = { ...formData, isDraft: true };

      // Add updated_by field with current user ID
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      formDataToSubmit.updated_by = currentUser.id || currentUser.user_id;

      // Format data based on listing type
      if (formDataToSubmit.listingType === "sale") {
        formDataToSubmit.rent_type = null;
        formDataToSubmit.deposit = null;
        formDataToSubmit.availability = {
          status: "Available",
          availableFrom: null,
          minLeasePeriod: null,
        };
      }

      // Ensure property status is set to a valid value
      if (formDataToSubmit.type === "pg") {
        formDataToSubmit.propertyStatus = "ready_to_move";
        formDataToSubmit.pg_type = formDataToSubmit.pgType;
      } else if (!formDataToSubmit.propertyStatus) {
        formDataToSubmit.propertyStatus = "ready_to_move";
      }

      // Add floor details and PG specific fields for PG properties
      if (formDataToSubmit.type === "pg") {
        formDataToSubmit.floorDetails = floorDetails.map((floor) => ({
          floorNumber: floor.floorNumber,
          rooms: floor.rooms.map((room) => ({
            roomNumber: room.roomNumber,
            capacity: room.capacity,
            occupied: room.occupied,
            rent: room.rent_amount,
            availableFrom: room.availableFrom,
            hasBalcony: room.hasBalcony,
          })),
        }));
      }

      // Ensure phone and dial code are included
      formDataToSubmit.phone = formDataToSubmit.phone;
      formDataToSubmit.dial_code = formDataToSubmit.dialCode;

      if (formData.images && formData.images.length > 0) {
        formDataToSubmit.images = formData.images.map((image) => {
          if (typeof image === "string") {
            return image;
          }
          return image;
        });
      }

      if (formData.amenities) {
        if (Array.isArray(formData.amenities)) {
          formDataToSubmit.amenities = formData.amenities;
        } else if (typeof formData.amenities === "string") {
          try {
            const parsed = JSON.parse(formData.amenities);
            formDataToSubmit.amenities = Array.isArray(parsed)
              ? parsed
              : [parsed];
          } catch (e) {
            formDataToSubmit.amenities = formData.amenities
              .split(",")
              .map((item) => item.trim());
          }
        }
      }

      let response;
      if (id) {
        response = await axios.put(
          `${backendurl}/api/properties/${id}`,
          formDataToSubmit,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        response = await axios.post(
          `${backendurl}/api/properties/draft`,
          formDataToSubmit,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      if (response.data.success) {
        setSuccess(true);
        toast.success(response.data.message);
        navigate("/customer-panel/properties");
      } else {
        setError(response.data.message || "Failed to save draft");
        toast.error(response.data.message || "Failed to save draft");
      }
    } catch (err) {
      console.error("Error saving draft:", err);

      // Handle specific foreign key constraint errors
      if (err.response?.data?.message?.includes("foreign key constraint")) {
        const errorMessage =
          "Cannot save draft because some rooms have pending availability requests. Please resolve these requests first or contact support.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage =
          err.response?.data?.message || "Failed to save draft";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = {
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    lineHeight: "1.5",
    borderRadius: "0.5rem",
    width: "100%",
    transition: "all 0.2s",
    outline: "none",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
  };

  const textareaStyles = {
    ...inputStyles,
    minHeight: "120px",
    resize: "vertical",
  };

  const selectStyles = {
    ...inputStyles,
    backgroundImage:
      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
    backgroundPosition: "right 0.5rem center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "1.5em 1.5em",
    paddingRight: "2.5rem",
    appearance: "none",
    cursor: "pointer",
  };

  const checkboxStyles = {
    width: "1rem",
    height: "1rem",
    borderRadius: "0.25rem",
    border: "1px solid #d1d5db",
    color: "#2563eb",
    focusRing: "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  };

  const getUserSpecificFields = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Admin Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Property Status
            </label>
            <select
              name="status"
              value={formData.status || "active"}
              onChange={handleChange}
              style={selectStyles}
              className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              name="verification_status"
              value={formData.verification_status || "unverified"}
              onChange={handleChange}
              style={selectStyles}
              className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  if (!isAdmin) {
    return null;
  }

  // Add this before the return statement
  if (!formData.type) {
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
              {id ? "Edit Property" : "List Your Property"}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {id
                ? "Update your property details below"
                : "Fill in the details below to list your property. All fields marked with * are required."}
            </p>
          </div>
          <form className="space-y-6">
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
            <div className="mt-8 text-center">
              <p className="text-lg font-semibold text-gray-700">
                Please select a property type to continue filling the details.
              </p>
            </div>
          </form>
        </div>
      </motion.div>
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
            {id ? "Edit Property" : "List Your Property"}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {id
              ? "Update your property details below"
              : "Fill in the details below to list your property. All fields marked with * are required."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Classification Section */}
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
                  <label lassName="block text-sm font-medium text-gray-700 mb-3">
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

          {/* Basic Information Section */}
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
                  formData.type &&
                  !["pg", "rk", "flat"].includes(formData.type) && (
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
                          onWheel={(e) => e.currentTarget.blur()}
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

              {/* Deposit Input Field for Admin */}
              {formData.listingType === "rent" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security Deposit *
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
                        onWheel={(e) => e.currentTarget.blur()}
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
                    {fieldErrors.deposit && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.deposit}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Set the security deposit amount manually
                    </p>
                  </div>

                  {/* Calculated Deposit Display */}
                  {formData.price > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">
                          Auto-Calculated Deposit
                        </span>
                        <span className="text-lg font-semibold text-blue-700">
                          ₹{calculatedDeposit.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Based on property type multiplier
                      </p>
                    </div>
                  )}
                </div>
              )}

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

          {/* Availability Details Section */}
          {formData.listingType === "rent" &&
            formData.type &&
            !["pg", "rk", "flat"].includes(formData.type) && (
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
                      onWheel={(e) => e.currentTarget.blur()}
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
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      style={selectStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Sale-Specific Details Section */}
          {formData.listingType === "sale" &&
            !["commercial plot", "residential plot"].includes(
              formData.type
            ) && (
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
                      onWheel={(e) => e.currentTarget.blur()}
                      min="0"
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      style={selectStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      style={selectStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Office-Specific Details */}
          {formData.listingType === "sale" && formData.type === "office" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                Office-Specific Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area (sq ft) *
                  </label>
                  <input
                    type="number"
                    name="officeArea"
                    value={formData.officeArea}
                    onChange={handleChange}
                    min="0"
                    style={inputStyles}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter office area"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Floors *
                  </label>
                  <input
                    type="number"
                    name="officeFloors"
                    value={formData.officeFloors}
                    onChange={handleChange}
                    min="1"
                    style={inputStyles}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of floors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="officeCapacity"
                    value={formData.officeCapacity}
                    onChange={handleChange}
                    min="0"
                    style={inputStyles}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter office capacity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Cabins
                  </label>
                  <input
                    type="number"
                    name="officeCabins"
                    value={formData.officeCabins}
                    onChange={handleChange}
                    min="0"
                    style={inputStyles}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of cabins"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Rooms
                  </label>
                  <input
                    type="number"
                    name="meetingRooms"
                    value={formData.meetingRooms}
                    onChange={handleChange}
                    min="0"
                    style={inputStyles}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of meeting rooms"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Head Cabins
                  </label>
                  <input
                    type="number"
                    name="headCabins"
                    value={formData.headCabins}
                    onChange={handleChange}
                    min="0"
                    style={inputStyles}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of head cabins"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Parking",
                    "Security",
                    "Lift",
                    "Power Backup",
                    "Central AC",
                    "Cafeteria",
                    "Conference Room",
                    "Reception Area",
                    "IT Infrastructure",
                    "Fire Safety",
                    "24/7 Security",
                    "Visitor Parking",
                  ].map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData.officeAmenities &&
                          formData.officeAmenities.includes(amenity)
                        }
                        onChange={() => {
                          const currentAmenities =
                            formData.officeAmenities || [];
                          const updatedAmenities = currentAmenities.includes(
                            amenity
                          )
                            ? currentAmenities.filter((a) => a !== amenity)
                            : [...currentAmenities, amenity];
                          setFormData((prev) => ({
                            ...prev,
                            officeAmenities: updatedAmenities,
                          }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Plot-Specific Details */}
          {formData.listingType === "sale" &&
            (formData.type === "commercial plot" ||
              formData.type === "residential plot") && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                  Plot-Specific Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (sq ft) *
                    </label>
                    <input
                      type="number"
                      name="plotArea"
                      value={formData.plotArea}
                      onChange={handleChange}
                      min="0"
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter plot area"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nearby Area
                    </label>
                    <input
                      type="text"
                      name="nearbyArea"
                      value={formData.nearbyArea}
                      onChange={handleChange}
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter nearby area details"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Rental Income (Optional)
                    </label>
                    <input
                      type="number"
                      name="estimatedRentalIncome"
                      value={formData.estimatedRentalIncome}
                      onChange={handleChange}
                      min="0"
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter estimated rental income"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="underCommittee"
                      checked={formData.underCommittee}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          underCommittee: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Under Committee
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="passedBuildingLand"
                      checked={formData.passedBuildingLand}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          passedBuildingLand: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Passed Building Land
                    </label>
                  </div>
                </div>
              </div>
            )}

          {/* Builder Floor/House-Specific Details */}
          {formData.listingType === "sale" &&
            (formData.type === "builder floor" ||
              formData.type === "house") && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                  {formData.type === "builder floor"
                    ? "Builder Floor"
                    : "House"}
                  -Specific Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.type === "builder floor" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Floors *
                      </label>
                      <input
                        type="number"
                        name="builderFloors"
                        value={formData.builderFloors}
                        onChange={handleChange}
                        min="1"
                        style={inputStyles}
                        className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter number of floors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (sq ft) *
                    </label>
                    <input
                      type="number"
                      name="houseArea"
                      value={formData.houseArea}
                      onChange={handleChange}
                      min="0"
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter area"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Bedrooms *
                    </label>
                    <input
                      type="number"
                      name="houseBedrooms"
                      value={formData.houseBedrooms}
                      onChange={handleChange}
                      min="0"
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter number of bedrooms"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Bathrooms *
                    </label>
                    <input
                      type="number"
                      name="houseBathrooms"
                      value={formData.houseBathrooms}
                      onChange={handleChange}
                      min="0"
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter number of bathrooms"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Balconies
                    </label>
                    <input
                      type="number"
                      name="houseBalcony"
                      value={formData.houseBalcony}
                      onChange={handleChange}
                      min="0"
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter number of balconies"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Parking Spaces
                    </label>
                    <input
                      type="number"
                      name="houseParking"
                      value={formData.houseParking}
                      onChange={handleChange}
                      min="0"
                      style={inputStyles}
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter number of parking spaces"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Garden",
                      "Swimming Pool",
                      "Gym",
                      "Security System",
                      "Lift",
                      "Power Backup",
                      "Central AC",
                      "Fireplace",
                      "Home Theater",
                      "Study Room",
                      "Servant Quarter",
                      "Pooja Room",
                    ].map((amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.houseAmenities &&
                            formData.houseAmenities.includes(amenity)
                          }
                          onChange={() => {
                            const currentAmenities =
                              formData.houseAmenities || [];
                            const updatedAmenities = currentAmenities.includes(
                              amenity
                            )
                              ? currentAmenities.filter((a) => a !== amenity)
                              : [...currentAmenities, amenity];
                            setFormData((prev) => ({
                              ...prev,
                              houseAmenities: updatedAmenities,
                            }));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Details
                  </label>
                  <input
                    type="text"
                    name="houseLocation"
                    value={formData.houseLocation}
                    onChange={handleChange}
                    style={inputStyles}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter specific location details"
                  />
                </div>
              </div>
            )}

          {/* Location Details Section */}
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
                  className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search for location"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Start typing and select from the dropdown suggestions
                </p>
              </div>
            </div>
          </div>

          {/* Property Details Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Property Details
            </h2>

            <div className="space-y-6">
              <div
                className={`grid grid-cols-1 ${
                  formData.type && formData.type.includes("plot")
                    ? "md:grid-cols-1"
                    : "md:grid-cols-3"
                } gap-6`}
              >
                {/* Area Field */}
                {formData.listingType === "rent" &&
                  formData.type &&
                  !["pg", "rk", "flat"].includes(formData.type) && (
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
                        className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                {formData.listingType === "sale" && (
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
                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {formData.type &&
                  !formData.type.includes("plot") &&
                  !["pg", "rk", "flat"].includes(formData.type) &&
                  !(
                    formData.listingType === "sale" &&
                    ["office", "commercial"].includes(formData.type)
                  ) && (
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
                          onWheel={(e) => e.target.blur()}
                          min="0"
                          style={inputStyles}
                          className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          onWheel={(e) => e.target.blur()}
                          min="0"
                          style={inputStyles}
                          className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    style={selectStyles}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-fit"
                  >
                    {DIAL_CODES.map(({ code, country }) => (
                      <option key={code} value={code}>
                        {code} {country}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        style={inputStyles}
                        className={`w-full ${
                          fieldErrors.phone
                            ? "border-red-300"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                  className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your property..."
                />
              </div>
            </div>
          </div>

          {/* PG Specific Details Section */}
          {formData.listingType === "rent" &&
            formData.type &&
            ["pg", "rk", "flat"].includes(formData.type) && (
              <>
                {formData.type === "pg" && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                      PG Specific Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PG Type *
                        </label>
                        <select
                          name="pgType"
                          value={formData.pgType}
                          onChange={handleChange}
                          style={selectStyles}
                          className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select PG Type</option>
                          {PG_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floor & Room Details Section */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                    Floor & Room Details
                  </h2>

                  <div className="space-y-4">
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
                                    style={inputStyles}
                                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                {formData.type && formData.type !== "rk" && (
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
                                      style={inputStyles}
                                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                )}
                                {formData.type && formData.type !== "rk" && (
                                  <div>
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
                                      style={inputStyles}
                                      className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Max: {room.capacity}
                                    </p>
                                  </div>
                                )}
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
                                    onWheel={(e) => e.target.blur()}
                                    min="0"
                                    style={inputStyles}
                                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    style={inputStyles}
                                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </>
            )}

          {/* Amenities & Features Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Amenities & Features
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(formData.listingType === "sale"
                ? SALE_AMENITIES
                : RENT_AMENITIES
              ).map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityChange(amenity)}
                  className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                    formData.amenities && formData.amenities.includes(amenity)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      formData.amenities && formData.amenities.includes(amenity)
                    }
                    onChange={() => {}}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{amenity}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Property Images Section */}
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

          {/* Property Videos Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b">
              Property Videos
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videoPreviewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-video rounded-lg overflow-hidden"
                  >
                    <video
                      src={url}
                      controls
                      className="w-full h-full object-cover"
                    />
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
                    disabled={
                      videoUploading || (formData.videos?.length || 0) >= 3
                    }
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                You can upload up to 3 videos. Each video should be less than
                50MB.
              </p>
              {videoUploading && (
                <p className="text-blue-600">Uploading videos...</p>
              )}
            </div>
          </div>

          {/* Admin Controls Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {getUserSpecificFields()}
          </div>

          {/* Submit Buttons */}
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
              {loading
                ? "Submitting..."
                : imageUploading
                ? "Uploading Images..."
                : videoUploading
                ? "Uploading Videos..."
                : "List Property"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Update;
