
import Role from '../models/Role.js';
import mongoose from "mongoose";

export const initializeRoles = async () => {

    try {
        if (mongoose.models.Role) {
            delete mongoose.models.Role;
        }
    const defaultRoles = [
        {
            name: 'individual',
            description: 'Regular individual user',
            isActive: true
        },
        {
            name: 'corporate',
            description: 'Corporate user with additional privileges',
            isActive: true
        },
        {
            name: 'dealer',
            description: 'Property dealer with property management privileges',
            isActive: true
        },
        {
            name: 'admin',
            description: 'System administrator',
            isActive: true
        }
    ];

        const bulkOps = defaultRoles.map(role => ({
            updateOne: {
                filter: { name: role.name },
                update: { $set: role },
                upsert: true
            }
        }));

        await Role.bulkWrite(bulkOps);
        console.log('Roles initialized/updated successfully');
    } catch (error) {
        console.error('Error initializing roles:', error);
        throw error;
    }
};
