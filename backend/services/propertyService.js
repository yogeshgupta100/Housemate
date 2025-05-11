import mongoose from 'mongoose';
import Property from '../models/propertymodel.js';
import propertyRepository from '../repositories/propertyRepository.js';
// import cloudinary from '../utils/cloudinary.js';

class PropertyService {
  async getAllProperties(filters, page = 1, limit = 10) {
    const allProperties = await propertyRepository.findAll(filters, page, limit);
    console.log('All Properties:', allProperties.length); // Debugging line
    return allProperties;
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
    // Ensure userId and createdBy are valid ObjectIds
    const defaultAdminId = '657089f229c2df66a7ea7c0d'; 
    
    propertyData.userId = mongoose.Types.ObjectId.isValid(propertyData.userId) 
      ? propertyData.userId 
      : defaultAdminId;
      
    propertyData.createdBy = mongoose.Types.ObjectId.isValid(propertyData.createdBy)
      ? propertyData.createdBy
      : defaultAdminId;

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
