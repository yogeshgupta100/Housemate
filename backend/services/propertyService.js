import Property from '../models/propertymodel.js';
import propertyRepository from '../repositories/propertyRepository.js';
// import cloudinary from '../utils/cloudinary.js';

class PropertyService {
  async getAllProperties(filters, page = 1, limit = 10) {
    return await propertyRepository.findAll(filters, page, limit);
  }

  async getPropertyById(id) {
    try {
      const property = await Property.findById(id);
      if (!property) {
        throw new Error('Property not found');
      }
      return property;
    } catch (error) {
      throw new Error(`Error fetching property: ${error.message}`);
    }
  }

  async createProperty(propertyData) {
    // Ensure userId is set to the authenticated user's ID
    if (!propertyData.userId) {
      propertyData.userId = propertyData.createdBy;
    }

    // Handle image uploads if any
    // if (propertyData.images && propertyData.images.length > 0) {
    //   const uploadPromises = propertyData.images.map(image => 
    //     cloudinary.uploader.upload(image, {
    //       folder: 'properties'
    //     })
    //   );
    //   const uploadResults = await Promise.all(uploadPromises);
    //   propertyData.images = uploadResults.map(result => result.secure_url);
    // }

    return await propertyRepository.create(propertyData);
  }

  async updateProperty(id, updateData) {
    // Prevent modification of userId to protect ownership
    delete updateData.userId;

    // Handle image updates if any
    // if (updateData.images && updateData.images.length > 0) {
    //   const uploadPromises = updateData.images.map(image => 
    //     cloudinary.uploader.upload(image, {
    //       folder: 'properties'
    //     })
    //   );
    //   const uploadResults = await Promise.all(uploadPromises);
    //   updateData.images = uploadResults.map(result => result.secure_url);
    // }

    return await propertyRepository.update(id, updateData);
  }
}

export default new PropertyService();
