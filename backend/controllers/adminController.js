import Stats from "../models/statsModel.js";
import Property from "../models/propertymodel.js";
import Appointment from "../models/appointmentModel.js";
import transporter from "../config/nodemailer.js";
import { getEmailTemplate } from "../email.js";
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAllProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    getDashboardStats
} from '../services/adminService.js';
import catchAsync from '../utils/catchAsync.js';
import pool from '../config/postgres.js';

const formatRecentProperties = (properties) => {
  return properties.map((property) => ({
    type: "property",
    description: `New property listed: ${property.title}`,
    timestamp: property.createdAt,
  }));
};

const formatRecentAppointments = (appointments) => {
  return appointments.map((appointment) => ({
    type: "appointment",
    description:
      appointment.userId && appointment.propertyId
        ? `${appointment.userId.name} scheduled viewing for ${appointment.propertyId.title}`
        : "Appointment scheduled",
    timestamp: appointment.createdAt,
  }));
};

export const getAdminStats = async (req, res) => {
  try {
    const { rows: [{ total_properties }] } = await pool.query('SELECT COUNT(*) as total_properties FROM properties');
    const { rows: [{ active_listings }] } = await pool.query("SELECT COUNT(*) as active_listings FROM properties WHERE status = 'active'");
    const { rows: [{ total_users }] } = await pool.query('SELECT COUNT(*) as total_users FROM users');
    const { rows: [{ pending_appointments }] } = await pool.query("SELECT COUNT(*) as pending_appointments FROM appointments WHERE status = 'pending'");

    res.json({
      success: true,
      stats: {
        totalProperties: parseInt(total_properties),
        activeListings: parseInt(active_listings),
        totalUsers: parseInt(total_users),
        pendingAppointments: parseInt(pending_appointments),
        // Add more stats as needed
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin statistics",
      error: error.message
    });
  }
};

const getRecentActivity = async () => {
  try {
    const recentProperties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt");

    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("propertyId", "title")
      .populate("userId", "name");

    // Filter out appointments with missing user or property data
    const validAppointments = recentAppointments.filter(
      (appointment) => appointment.userId && appointment.propertyId
    );

    return [
      ...formatRecentProperties(recentProperties),
      ...formatRecentAppointments(validAppointments),
    ].sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting recent activity:", error);
    return [];
  }
};

const getViewsData = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Stats.aggregate([
      {
        $match: {
          endpoint: /^\/api\/products\/single\//,
          method: "GET",
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Generate dates for last 30 days
    const labels = [];
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      labels.push(dateString);

      const stat = stats.find((s) => s._id === dateString);
      data.push(stat ? stat.count : 0);
    }

    return {
      labels,
      datasets: [
        {
          label: "Property Views",
          data,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  } catch (error) {
    console.error("Error generating chart data:", error);
    return {
      labels: [],
      datasets: [
        {
          label: "Property Views",
          data: [],
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }
};

export const fetchAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("propertyId", "title location")
      .populate("userId", "firstName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    ).populate("propertyId userId");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Send email notification using the template from email.js
    const mailOptions = {
      from: process.env.EMAIL,
      to: appointment.userId.email,
      subject: `Viewing Appointment ${
        status.charAt(0).toUpperCase() + status.slice(1)
      } - BuildEstate`,
      html: getEmailTemplate(appointment, status),
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating appointment",
    });
  }
};

export const getAdminDashboard = async (req, res) => {
    try {
        const dashboardData = await getDashboardStats();
        
        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

export const getPropertyAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const analytics = await getDashboardStats();
        
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching property analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch property analytics',
            error: error.message
        });
    }
};

export const getUserAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const analytics = await getDashboardStats();
        
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user analytics',
            error: error.message
        });
    }
};

export const getRevenueAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const analytics = await getDashboardStats();
        
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue analytics',
            error: error.message
        });
    }
};

export const getSystemHealth = async (req, res) => {
    try {
        const healthData = await getDashboardStats();
        
        res.json({
            success: true,
            data: healthData
        });
    } catch (error) {
        console.error('Error fetching system health:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system health',
            error: error.message
        });
    }
};

export const getUsers = catchAsync(async (req, res) => {
    const users = await getAllUsers(req.query);
    res.json({
        success: true,
        data: users
    });
});

export const getUser = catchAsync(async (req, res) => {
    const user = await getUserById(req.params.id);
    res.json({
        success: true,
        data: user
    });
});

export const updateUserDetails = catchAsync(async (req, res) => {
    const user = await updateUser(req.params.id, req.body);
    res.json({
        success: true,
        message: 'User updated successfully',
        data: user
    });
});

export const removeUser = catchAsync(async (req, res) => {
    await deleteUser(req.params.id);
    res.json({
        success: true,
        message: 'User deleted successfully'
    });
});

export const getProperties = catchAsync(async (req, res) => {
    const properties = await getAllProperties(req.query);
    res.json({
        success: true,
        data: properties
    });
});

export const getProperty = catchAsync(async (req, res) => {
    const property = await getPropertyById(req.params.id);
    res.json({
        success: true,
        data: property
    });
});

export const updatePropertyDetails = catchAsync(async (req, res) => {
    const property = await updateProperty(req.params.id, req.body);
    res.json({
        success: true,
        message: 'Property updated successfully',
        data: property
    });
});

export const removeProperty = catchAsync(async (req, res) => {
    await deleteProperty(req.params.id);
    res.json({
        success: true,
        message: 'Property deleted successfully'
    });
});

export const getAppointments = catchAsync(async (req, res) => {
    const appointments = await getAllAppointments(req.query);
    res.json({
        success: true,
        data: appointments
    });
});

export const getAppointment = catchAsync(async (req, res) => {
    const appointment = await getAppointmentById(req.params.id);
    res.json({
        success: true,
        data: appointment
    });
});

export const updateAppointmentDetails = catchAsync(async (req, res) => {
    const appointment = await updateAppointment(req.params.id, req.body);
    res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment
    });
});

export const removeAppointment = catchAsync(async (req, res) => {
    await deleteAppointment(req.params.id);
    res.json({
        success: true,
        message: 'Appointment deleted successfully'
    });
});

export const getStats = catchAsync(async (req, res) => {
    const stats = await getDashboardStats();
    res.json({
        success: true,
        data: stats
    });
});
