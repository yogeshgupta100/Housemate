import propertyRepository from '../repositories/propertyRepository.js';
// import cloudinary from '../utils/cloudinary.js';

class PropertyService {
  async getAllProperties(filters, page = 1, limit = 10) {
    return await propertyRepository.findAll(filters, page, limit);
  }

  async getPropertyById(id) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      throw new Error('Property not found');
    }
    return property;
  }

  async createProperty(propertyData) {
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
