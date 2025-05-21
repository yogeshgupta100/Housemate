// import propertyRepository from '../repositories/propertyRepository.js';
// // import cloudinary from '../utils/cloudinary.js';

// class PropertyService {
//   async getAllProperties(filters, page = 1, limit = 10) {
//     try {
//       // Convert MongoDB-style filters to PostgreSQL-style
//       const pgFilters = {};
      
//       if (filters.$or) {
//         // Handle text search
//         const searchTerms = filters.$or.map(term => {
//           const field = Object.keys(term)[0];
//           const value = term[field].$regex;
//           return `${field} ILIKE '%${value}%'`;
//         });
//         pgFilters.search = searchTerms.join(' OR ');
//       }

//       // Handle exact matches
//       ['type', 'listing_type', 'beds', 'baths', 'verified'].forEach(field => {
//         if (filters[field] !== undefined) {
//           pgFilters[field] = filters[field];
//         }
//       });

//       // Handle range queries
//       if (filters.price) {
//         pgFilters.price = {};
//         if (filters.price.$gte) pgFilters.price.min = filters.price.$gte;
//         if (filters.price.$lte) pgFilters.price.max = filters.price.$lte;
//       }

//       if (filters.sqft) {
//         pgFilters.sqft = {};
//         if (filters.sqft.$gte) pgFilters.sqft.min = filters.sqft.$gte;
//         if (filters.sqft.$lte) pgFilters.sqft.max = filters.sqft.$lte;
//       }

//       // Handle amenities array
//       if (filters.amenities) {
//         pgFilters.amenities = filters.amenities;
//       }

//       const properties = await propertyRepository.findAll(pgFilters, page, limit);
//       return properties;
//     } catch (error) {
//       console.error('Error in getAllProperties:', error);
//       throw new Error(`Failed to fetch properties: ${error.message}`);
//     }
//   }

//   async getPropertyById(id) {
//     try {
//       const property = await propertyRepository.findById(id);

//       if (!property) {
//         throw new Error('Property not found');
//       }
//       return property;
//     } catch (error) {
//       throw new Error(`Error fetching property: ${error.message}`);
//     }
//   }

//   async createProperty(propertyData) {
//     // Set default admin ID if userId is not provided
//     const defaultAdminId = '00000000-0000-0000-0000-000000000000'; // all zeros UUID as placeholder // Assuming 1 is the admin ID in PostgreSQL
    
//     propertyData.user_id = propertyData.user_id || defaultAdminId;
//     propertyData.created_by = propertyData.created_by || defaultAdminId;

//     return await propertyRepository.create(propertyData);
//   }

//   async updateProperty(id, updateData) {
//     // Prevent modification of userId to protect ownership
//     delete updateData.user_id;

//     // Handle image updates if any
//     // if (updateData.images && updateData.images.length > 0) {
//     //   const uploadPromises = updateData.images.map(image => 
//     //     cloudinary.uploader.upload(image, {
//     //       folder: 'properties'
//     //     })
//     //   );
//     //   const uploadResults = await Promise.all(uploadPromises);
//     //   updateData.images = uploadResults.map(result => result.secure_url);
//     // }

//     return await propertyRepository.update(id, updateData);
//   }
// }

// export default new PropertyService();

import propertyRepository from '../repositories/propertyRepository.js';
import { isValidUUID } from '../utils/validateUUID.js';

class PropertyService {
  async getAllProperties(filters = {}, page = 1, limit = 10) {
    try {
      const pgFilters = {};
  
      // Text search conversion
      if (filters.$or) {
        const searchTerms = filters.$or.map(term => {
          const field = Object.keys(term)[0];
          const value = term[field].$regex;
          return `${field} ILIKE '%${value}%'`;
        });
        pgFilters.search = searchTerms.join(' OR ');
      }
  
      // Exact matches with validation for UUID fields
      ['type', 'listing_type', 'beds', 'baths', 'verified'].forEach(field => {
        if (filters[field] !== undefined) {
          pgFilters[field] = filters[field];
        }
      });
  
      // Validate UUID filters strictly
      if (filters.user_id) {
        if (typeof filters.user_id === 'string' && isValidUUID(filters.user_id)) {
          pgFilters.user_id = filters.user_id;
        } else {
          console.warn('Invalid user_id filter ignored:', filters.user_id);
        }
      }
  
      if (filters.created_by) {
        if (typeof filters.created_by === 'string' && isValidUUID(filters.created_by)) {
          pgFilters.created_by = filters.created_by;
        } else {
          console.warn('Invalid created_by filter ignored:', filters.created_by);
        }
      }
  
      // Range filters for price
      if (filters.price) {
        pgFilters.price = {};
        if (filters.price.$gte !== undefined) pgFilters.price.min = filters.price.$gte;
        if (filters.price.$lte !== undefined) pgFilters.price.max = filters.price.$lte;
      }
  
      // Range filters for sqft
      if (filters.sqft) {
        pgFilters.sqft = {};
        if (filters.sqft.$gte !== undefined) pgFilters.sqft.min = filters.sqft.$gte;
        if (filters.sqft.$lte !== undefined) pgFilters.sqft.max = filters.sqft.$lte;
      }
  
      // Amenities array filter
      if (filters.amenities) {
        pgFilters.amenities = filters.amenities;
      }
  
      const properties = await propertyRepository.findAll(pgFilters, page, limit);
      return properties;
    } catch (error) {
      console.error('Error in getAllProperties:', error);
      throw new Error(`Failed to fetch properties: ${error.message}`);
    }
  }

  async getPropertyById(id) {
    try {
      const property = await propertyRepository.findById(parseInt(id));
      if (!property) {
        throw new Error('Property not found');
      }
      return property;
    } catch (error) {
      throw new Error(`Error fetching property: ${error.message}`);
    }
  }

  async createProperty(propertyData) {
    const defaultAdminId = '00000000-0000-0000-0000-000000000000';

    if (!propertyData.user_id || !isValidUUID(propertyData.user_id)) {
      propertyData.user_id = defaultAdminId;
    }

    if (!propertyData.created_by || !isValidUUID(propertyData.created_by)) {
      propertyData.created_by = defaultAdminId;
    }

    return await propertyRepository.create(propertyData);
  }

  async updateProperty(id, updateData) {
    // Prevent user_id changes for ownership protection
    delete updateData.user_id;

    if (updateData.created_by && !isValidUUID(updateData.created_by)) {
      updateData.created_by = '00000000-0000-0000-0000-000000000000';
    }

    return await propertyRepository.findByIdAndUpdate(id, updateData);
  }
}

export default new PropertyService();
