import Role from "../models/role.js";
import authService from "../services/authService.js";

export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({ isActive: true, name: 'individual' });
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find({ isActive: true});
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const assignRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        const updatedUser = await authService.changeUserRole(userId, roleId);

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};