import userModel from '../models/userModel.js';
import propertyModel from '../models/propertymodel.js';
import appointmentModel from '../models/appointmentModel.js';

export const getAllUsers = async (filters = {}) => {
    try {
        const users = await userModel.findAll(filters);
        return users;
    } catch (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
    }
};

export const getUserById = async (userId) => {
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
};

export const updateUser = async (userId, updateData) => {
    try {
        const user = await userModel.update(userId, updateData);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(`Failed to update user: ${error.message}`);
    }
};

export const deleteUser = async (userId) => {
    try {
        const user = await userModel.delete(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
    }
};

export const getAllProperties = async (filters = {}) => {
    try {
        const properties = await propertyModel.findAll(filters);
        return properties;
    } catch (error) {
        throw new Error(`Failed to fetch properties: ${error.message}`);
    }
};

export const getPropertyById = async (propertyId) => {
    try {
        const property = await propertyModel.findById(propertyId);
        if (!property) {
            throw new Error('Property not found');
        }
        return property;
    } catch (error) {
        throw new Error(`Failed to fetch property: ${error.message}`);
    }
};

export const updateProperty = async (propertyId, updateData) => {
    try {
        const property = await propertyModel.update(propertyId, updateData);
        if (!property) {
            throw new Error('Property not found');
        }
        return property;
    } catch (error) {
        throw new Error(`Failed to update property: ${error.message}`);
    }
};

export const deleteProperty = async (propertyId) => {
    try {
        const property = await propertyModel.delete(propertyId);
        if (!property) {
            throw new Error('Property not found');
        }
        return property;
    } catch (error) {
        throw new Error(`Failed to delete property: ${error.message}`);
    }
};

export const getAllAppointments = async (filters = {}) => {
    try {
        const appointments = await appointmentModel.findAll(filters);
        return appointments;
    } catch (error) {
        throw new Error(`Failed to fetch appointments: ${error.message}`);
    }
};

export const getAppointmentById = async (appointmentId) => {
    try {
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            throw new Error('Appointment not found');
        }
        return appointment;
    } catch (error) {
        throw new Error(`Failed to fetch appointment: ${error.message}`);
    }
};

export const updateAppointment = async (appointmentId, updateData) => {
    try {
        const appointment = await appointmentModel.update(appointmentId, updateData);
        if (!appointment) {
            throw new Error('Appointment not found');
        }
        return appointment;
    } catch (error) {
        throw new Error(`Failed to update appointment: ${error.message}`);
    }
};

export const deleteAppointment = async (appointmentId) => {
    try {
        const appointment = await appointmentModel.delete(appointmentId);
        if (!appointment) {
            throw new Error('Appointment not found');
        }
        return appointment;
    } catch (error) {
        throw new Error(`Failed to delete appointment: ${error.message}`);
    }
};

export const getDashboardStats = async () => {
    try {
        const [
            totalUsers,
            totalProperties,
            appointmentStats,
            recentAppointments
        ] = await Promise.all([
            userModel.count(),
            propertyModel.count(),
            appointmentModel.getStats(),
            appointmentModel.findAll({ limit: 5, orderBy: 'created_at DESC' })
        ]);

        return {
            totalUsers,
            totalProperties,
            appointmentStats,
            recentAppointments
        };
    } catch (error) {
        throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
}; 