import User from '../models/Usermodel.js'; // Fix import path

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
}

export default new UserService();