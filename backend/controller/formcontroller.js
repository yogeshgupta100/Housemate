


    


import { createForm } from '../models/formmodel.js';

export const submitForm = async (req, res) => {
  try {
    const form = await createForm(req.body);
    res.json({ success: true, form });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};