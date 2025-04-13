import Stats from '../models/statsModel.js';
import Property from '../models/propertymodel.js';
import Appointment from '../models/appointmentModel.js';
import User from '../models/Usermodel.js';  // need to make a User in model in models**

class AdminRepository {
  async getStats() {
    return {
      totalProperties: await Property.countDocuments(),
      activeListings: await Property.countDocuments({ status: 'active' }),
      totalUsers: await User.countDocuments(),
      pendingAppointments: await Appointment.countDocuments({ status: 'pending' })
    };
  }

  async getRecentProperties() {
    return await Property.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt');
  }

  async getRecentAppointments() {
    return await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('propertyId', 'title')
      .populate('userId', 'name');
  }

  async getPropertyViews(startDate) {
    return await Stats.aggregate([
      {
        $match: {
          endpoint: /^\/api\/products\/single\//,
          method: 'GET',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
  }

  async getAllAppointments() {
    return await Appointment.find()
      .populate('propertyId', 'title location')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
  }

  async updateAppointmentStatus(appointmentId, status) {
    return await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    ).populate('propertyId userId');
  }
}

export default new AdminRepository();
