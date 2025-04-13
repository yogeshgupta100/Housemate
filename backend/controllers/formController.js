import formService from '../services/formService.js';
import { catchAsync } from '../utils/catchAsync.js';

export const submitForm = catchAsync(async (req, res) => {
  const form = await formService.submitForm(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Form submitted successfully',
    data: form
  });
});
