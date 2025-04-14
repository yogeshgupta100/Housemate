import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Role description is required']
    },
    permissions: [{
        type: String,
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

export default Role;
