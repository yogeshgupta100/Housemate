import Newsletter from '../models/newsletterModel.js';

export const submitNewsletter = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email already exists
        const existingSubscriber = await Newsletter.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({
                success: false,
                message: 'Email already subscribed'
            });
        }

        // Create new newsletter subscription
        const newsletter = await Newsletter.create({
            email,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: newsletter
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe to newsletter',
            error: error.message
        });
    }
}; 