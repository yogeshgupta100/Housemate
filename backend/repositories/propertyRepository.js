import Property from '../models/propertymodel.js';

class PropertyRepository {
  async create(propertyData) {
    const property = new Property(propertyData);
    return await property.save();
  }

  async findById(id) {
    return await Property.findById(id);
  }

  async findBySlug(slug) {
    return await Property.findOne({ slug });
  }

  async findAll(filter, skip, limit, sort = { createdAt: -1 }) {
    return await Property.find(filter)
      .sort(sort)
      // .skip(skip)
      .limit(limit);
  }

  async countDocuments(filter) {
    return await Property.countDocuments(filter);
  }

  async findByIdAndUpdate(id, updateData) {
    return await Property.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
  }

  async findByIdAndDelete(id) {
    return await Property.findByIdAndDelete(id);
  }

  async findByUser(userId) {
    return await Property.find({ createdBy: userId }).sort({ createdAt: -1 });
  }

  async findFeatured(limit = 6) {
    return await Property.find({ featured: true, status: 'Active' })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export default new PropertyRepository();
