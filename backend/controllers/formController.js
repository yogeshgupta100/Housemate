import formService from '../services/formService.js';
import catchAsync from '../utils/catchAsync.js';
import newsletterModel from '../models/newsletterModel.js';
import { isValidEmail } from '../utils/validators.js';

export const submitForm = catchAsync(async (req, res) => {
  const form = await formService.submitForm(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Form submitted successfully',
    data: form
  });
});

export const submitNewsletter = catchAsync(async (req, res) => {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }

    const subscriber = await newsletterModel.subscribe(email);

    res.status(201).json({
        success: true,
        message: 'Successfully subscribed to newsletter',
        data: subscriber
    });
});
