import Role from "../models/role.js";
import authService from "../services/authService.js";
import pool from "../config/postgres.js";

export const getRoles = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, description FROM roles WHERE is_active = true'
        );
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching roles'
        });
    }
};

export const getAllRoles = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, description FROM roles WHERE is_active = true'
        );
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching all roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching roles'
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