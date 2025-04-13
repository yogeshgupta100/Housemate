import User from '../models/userModel.js';

class UserRepository {
  async findAll() {
    return await User.find().select('-password');
  }

  async findById(id) {
    return await User.findById(id).select('-password');
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  async findByResetPasswordToken(token) {
    return await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });
  }
}

export default new UserRepository();
