import RoomAvailabilityRequest from "../models/roomAvailabilityRequest.js";

export const createRequest = async (req, res) => {
  try {
    const { roomId, propertyId, ownerId } = req.body;
    const request = await RoomAvailabilityRequest.create({
      roomId,
      propertyId,
      ownerId,
    });
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllPending = async (req, res) => {
  try {
    const requests = await RoomAvailabilityRequest.getAllPending();
    console.log("getAllPending returning:", requests);
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching details for request ID:", id);
    const details = await RoomAvailabilityRequest.getByIdWithDetails(id);
    console.log("Details result:", details);
    if (!details) {
      console.log("No details found for ID:", id);
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }
    res.json({ success: true, details });
  } catch (err) {
    console.error("Error in getRequestDetails:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const acceptRequest = async (req, res) => {
  console.log("acceptRequest");
  try {
    const { id } = req.params;
    console.log({ id });
    await RoomAvailabilityRequest.accept(id);
    res.json({ success: true });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await RoomAvailabilityRequest.reject(id);
    res.json({ success: true });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
