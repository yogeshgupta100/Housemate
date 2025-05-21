import Appointment from '../models/appointmentModel.js';
import Property from '../models/propertymodel.js';
import User from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { getEmailTemplate } from '../email.js';
import pool from '../config/postgres.js';

export const scheduleViewing = async (req, res) => {
    try {
        const { propertyId, date, time, notes } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!propertyId || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Property ID, date and time are required'
            });
        }

        // Check if property exists
        const { rows: [property] } = await pool.query(
            'SELECT id FROM properties WHERE id = $1',
            [propertyId]
        );

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Create appointment
        const { rows: [appointment] } = await pool.query(
            `INSERT INTO appointments 
            (property_id, user_id, preferred_date, preferred_time, notes, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *`,
            [propertyId, userId, date, time, notes]
        );

        // Get the created appointment with property and user details
        const { rows: [fullAppointment] } = await pool.query(`
            SELECT 
                a.*,
                p.title as property_title,
                p.location as property_location,
                u.first_name as user_first_name,
                u.last_name as user_last_name,
                u.email as user_email,
                u.phone as user_phone
            FROM appointments a
            LEFT JOIN properties p ON a.property_id = p.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = $1
        `, [appointment.id]);

        // Format the response
        const formattedAppointment = {
            id: fullAppointment.id,
            propertyId: {
                id: fullAppointment.property_id,
                title: fullAppointment.property_title,
                location: fullAppointment.property_location
            },
            userId: {
                id: fullAppointment.user_id,
                firstName: fullAppointment.user_first_name,
                lastName: fullAppointment.user_last_name,
                email: fullAppointment.user_email,
                phone: fullAppointment.user_phone
            },
            preferredDate: fullAppointment.preferred_date,
            preferredTime: fullAppointment.preferred_time,
            status: fullAppointment.status,
            notes: fullAppointment.notes,
            createdAt: fullAppointment.created_at,
            updatedAt: fullAppointment.updated_at
        };

        // Try to send confirmation email, but don't fail if it doesn't work
        try {
            const mailOptions = {
                from: process.env.EMAIL || 'yogeshgupta6524@gmail.com',
                to: req.user.email || 'yjinlove05@gmail.com',
                subject: 'Viewing Appointment Scheduled - BuildEstate',
                html: getEmailTemplate(formattedAppointment, 'pending')
            };

            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't throw the error, just log it
        }

        res.status(201).json({
            success: true,
            message: 'Viewing appointment scheduled successfully',
            data: formattedAppointment
        });
    } catch (error) {
        console.error('Error scheduling viewing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule viewing',
            error: error.message
        });
    }
};

export const getAllAppointments = async (req, res) => {
    try {
        const { rows: appointments } = await pool.query(`
            SELECT 
                a.*,
                p.title as property_title,
                p.location as property_location,
                u.first_name as user_first_name,
                u.last_name as user_last_name,
                u.email as user_email,
                u.phone as user_phone
            FROM appointments a
            LEFT JOIN properties p ON a.property_id = p.id
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
        `);

        // Format the response to match the expected structure
        const formattedAppointments = appointments.map(appointment => ({
            id: appointment.id,
            propertyId: {
                id: appointment.property_id,
                title: appointment.property_title,
                location: appointment.property_location
            },
            userId: {
                id: appointment.user_id,
                firstName: appointment.user_first_name,
                lastName: appointment.user_last_name,
                email: appointment.user_email,
                phone: appointment.user_phone
            },
            preferredDate: appointment.preferred_date,
            preferredTime: appointment.preferred_time,
            status: appointment.status,
            notes: appointment.notes,
            createdAt: appointment.created_at,
            updatedAt: appointment.updated_at
        }));

        res.json({
            success: true,
            data: formattedAppointments
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: error.message
        });
    }
};

export const getAppointmentsByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const appointments = await Appointment.find({ userId })
            .populate('propertyId', 'title location images')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: appointments
        });
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: error.message
        });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { status } = req.body;

        if (!appointmentId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID and status are required'
            });
        }

        // Update the appointment status
        const { rows: [updated] } = await pool.query(
            'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, appointmentId]
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Get the updated appointment with property and user details
        const { rows: [fullAppointment] } = await pool.query(`
            SELECT 
                a.*,
                p.title as property_title,
                p.location as property_location,
                u.first_name as user_first_name,
                u.last_name as user_last_name,
                u.email as user_email,
                u.phone as user_phone
            FROM appointments a
            LEFT JOIN properties p ON a.property_id = p.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = $1
        `, [appointmentId]);

        if (!fullAppointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found after update'
            });
        }

        // Format the response
        const formattedAppointment = {
            id: fullAppointment.id,
            propertyId: {
                id: fullAppointment.property_id,
                title: fullAppointment.property_title,
                location: fullAppointment.property_location
            },
            userId: {
                id: fullAppointment.user_id,
                firstName: fullAppointment.user_first_name,
                lastName: fullAppointment.user_last_name,
                email: fullAppointment.user_email,
                phone: fullAppointment.user_phone
            },
            preferredDate: fullAppointment.preferred_date,
            preferredTime: fullAppointment.preferred_time,
            status: fullAppointment.status,
            notes: fullAppointment.notes,
            createdAt: fullAppointment.created_at,
            updatedAt: fullAppointment.updated_at
        };

        // Optionally send status update email (wrap in try/catch)
        try {
            const mailOptions = {
                from: process.env.EMAIL,
                to: fullAppointment.user_email,
                subject: `Viewing Appointment ${status.charAt(0).toUpperCase() + status.slice(1)} - BuildEstate`,
                html: getEmailTemplate(formattedAppointment, status)
            };
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Error sending status update email:', emailError);
        }

        res.json({
            success: true,
            message: `Appointment ${status} successfully`,
            data: formattedAppointment
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment status',
            error: error.message
        });
    }
};

export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const appointment = await Appointment.findOne({ _id: id, userId });
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        // Send cancellation email
        const mailOptions = {
            from: process.env.EMAIL,
            to: req.user.email,
            subject: 'Viewing Appointment Cancelled - BuildEstate',
            html: getEmailTemplate(appointment, 'cancelled')
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: appointment
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel appointment',
            error: error.message
        });
    }
};

export const updateAppointmentMeetingLink = async (req, res) => {
    try {
        const { appointmentId, meetingLink } = req.body;

        if (!appointmentId || !meetingLink) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID and meeting link are required'
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { meetingLink },
            { new: true }
        ).populate('propertyId userId');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Send meeting link email
        const mailOptions = {
            from: process.env.EMAIL,
            to: appointment.userId.email,
            subject: 'Viewing Appointment Meeting Link - BuildEstate',
            html: getEmailTemplate(appointment, 'meeting_link')
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Meeting link updated successfully',
            data: appointment
        });
    } catch (error) {
        console.error('Error updating meeting link:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update meeting link',
            error: error.message
        });
    }
};

export const getAppointmentStats = async (req, res) => {
    try {
        const stats = await Appointment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalAppointments = await Appointment.countDocuments();
        const todayAppointments = await Appointment.countDocuments({
            createdAt: {
                $gte: new Date().setHours(0, 0, 0, 0)
            }
        });

        res.json({
            success: true,
            data: {
                statusBreakdown: stats,
                totalAppointments,
                todayAppointments
            }
        });
    } catch (error) {
        console.error('Error fetching appointment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointment stats',
            error: error.message
        });
    }
};

export const submitAppointmentFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, feedback } = req.body;
        const userId = req.user.id;

        if (!rating || !feedback) {
            return res.status(400).json({
                success: false,
                message: 'Rating and feedback are required'
            });
        }

        const appointment = await Appointment.findOne({ _id: id, userId });
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.feedback = {
            rating,
            comment: feedback,
            submittedAt: new Date()
        };
        await appointment.save();

        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            data: appointment
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};

export const getUpcomingAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointments = await Appointment.find({
            userId,
            preferredDate: { $gte: today },
            status: { $in: ['pending', 'confirmed'] }
        })
        .populate('propertyId', 'title location images')
        .sort({ preferredDate: 1 });

        res.json({
            success: true,
            data: appointments
        });
    } catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming appointments',
            error: error.message
        });
    }
}; 