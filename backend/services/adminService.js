import userRepository from '../repositories/userRepository.js';
import propertyRepository from '../repositories/propertyRepository.js';
import { AppError } from '../utils/error.js';

export const getAllUsers = async (filters = {}) => {
    try {
        const users = await userRepository.findAll(filters);
        return users;
    } catch (error) {
        throw new AppError(`Failed to fetch users: ${error.message}`, 500);
    }
};

export const getUserById = async (userId) => {
    try {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Get user's properties
        const properties = await propertyRepository.findByUser(userId);

        return {
            ...user,
            properties
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`Failed to fetch user: ${error.message}`, 500);
    }
};

export const updateUser = async (userId, updateData) => {
    try {
        const user = await userRepository.update(userId, updateData);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`Failed to update user: ${error.message}`, 500);
    }
};

export const deleteUser = async (userId) => {
    try {
        const user = await userRepository.delete(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`Failed to delete user: ${error.message}`, 500);
    }
};

export const getAllProperties = async (filters = {}) => {
    try {
        const properties = await propertyRepository.findAll(filters);
        return properties;
    } catch (error) {
        throw new AppError(`Failed to fetch properties: ${error.message}`, 500);
    }
};

export const getPropertyById = async (propertyId) => {
    try {
        const property = await propertyRepository.findById(propertyId);
        if (!property) {
            throw new AppError('Property not found', 404);
        }
        return property;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`Failed to fetch property: ${error.message}`, 500);
    }
};

export const updateProperty = async (propertyId, updateData) => {
    try {
        const property = await propertyRepository.update(propertyId, updateData);
        if (!property) {
            throw new AppError('Property not found', 404);
        }
        return property;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`Failed to update property: ${error.message}`, 500);
    }
};

export const deleteProperty = async (propertyId) => {
    try {
        const property = await propertyRepository.delete(propertyId);
        if (!property) {
            throw new AppError('Property not found', 404);
        }
        return property;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`Failed to delete property: ${error.message}`, 500);
    }
};

// export const getAllAppointments = async (filters = {}) => {
//     try {
//         const appointments = await appointmentRepository.findAll(filters);
//         return appointments;
//     } catch (error) {
//         throw new AppError(`Failed to fetch appointments: ${error.message}`, 500);
//     }
// };

// export const getAppointmentById = async (appointmentId) => {
//     try {
//         const appointment = await appointmentRepository.findById(appointmentId);
//         if (!appointment) {
//             throw new AppError('Appointment not found', 404);
//         }
//         return appointment;
//     } catch (error) {
//         if (error instanceof AppError) throw error;
//         throw new AppError(`Failed to fetch appointment: ${error.message}`, 500);
//     }
// };

// export const updateAppointment = async (appointmentId, updateData) => {
//     try {
//         const appointment = await appointmentRepository.update(appointmentId, updateData);
//         if (!appointment) {
//             throw new AppError('Appointment not found', 404);
//         }
//         return appointment;
//     } catch (error) {
//         if (error instanceof AppError) throw error;
//         throw new AppError(`Failed to update appointment: ${error.message}`, 500);
//     }
// };

// export const deleteAppointment = async (appointmentId) => {
//     try {
//         const appointment = await appointmentRepository.delete(appointmentId);
//         if (!appointment) {
//             throw new AppError('Appointment not found', 404);
//         }
//         return appointment;
//     } catch (error) {
//         if (error instanceof AppError) throw error;
//         throw new AppError(`Failed to delete appointment: ${error.message}`, 500);
//     }
// };

export const getDashboardStats = async () => {
    try {
        const [
            totalUsers,
            totalProperties,
            appointmentStats,
            recentAppointments
        ] = await Promise.all([
            userRepository.count(),
            propertyRepository.count(),
            // appointmentRepository.getStats(),
            // appointmentRepository.findAll({ limit: 5, orderBy: 'created_at DESC' })
        ]);

        return {
            totalUsers,
            totalProperties,
            // appointmentStats,
            // recentAppointments
        };
    } catch (error) {
        throw new AppError(`Failed to fetch dashboard stats: ${error.message}`, 500);
    }
}; 