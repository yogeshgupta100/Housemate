import propertyService from '../services/propertyService.js';

export const getAllProperties = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const properties = await propertyService.getAllProperties(filters, page, limit);
    res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const createProperty = async (req, res) => {
  try {
    const property = await propertyService.createProperty({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const property = await propertyService.updateProperty(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    await propertyService.deleteProperty(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const searchProperties = async (req, res) => {
  try {
    const properties = await propertyService.searchProperties(req.query);
    res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
