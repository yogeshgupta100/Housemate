import userService from '../services/userService.js'; //kkjn ok oknijn
import { validateUser } from '../utils/validators.js';
import { hashPassword } from '../utils/auth.js';

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.search = req.query.search;
    }
    
    if (req.query.userType) {
      query.userType = req.query.userType;
    }

    const [users, totalUsers] = await Promise.all([
      userService.getPaginatedUsers(query, skip, limit),
      userService.getTotalUsers(query)
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalItems: totalUsers,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(404).json({
      success: false,
      message: 'User not found',
      error: error.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;

        // Remove sensitive fields
        delete updateData.password;
        delete updateData.role;
        delete updateData.email;

        const updatedUser = await userService.updateUser(userId, updateData);

        res.json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

export const getUserDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const dashboardData = await userService.getUserDashboard(userId);
        
        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Error fetching user dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const notifications = await userService.getUserNotifications(userId, page, limit);
        
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        await userService.markNotificationAsRead(userId, notificationId);
        
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

export const getUserActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const activity = await userService.getUserActivity(userId, page, limit);
        
        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity',
            error: error.message
        });
    }
};
