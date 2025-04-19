import User from '../models/userModel.js'; 

class UserService {
  async getAllUsers() {
    return await User.find().select('-password');
  }

  async getUserById(id) {
    const user = await User.findById(id).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  async getPaginatedUsers(query = {}, skip = 0, limit = 10) {
    return await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async getTotalUsers(query = {}) {
    return await User.countDocuments(query);
  }
}

export default new UserService();