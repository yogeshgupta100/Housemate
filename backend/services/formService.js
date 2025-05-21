import formModel from '../models/formmodel.js';
import { AppError } from '../utils/error.js';

class FormService {
  async submitForm(formData) {
    if (!formData.email || !formData.message) {
      throw new AppError('Email and message are required', 400);
    }

    return await formModel.create(formData);
  }
}

export default new FormService();
