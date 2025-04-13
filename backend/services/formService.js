import formRepository from '../repositories/formRepository.js';
import { AppError } from '../utils/error.js';

class FormService {
  async submitForm(formData) {
    if (!formData.email || !formData.message) {
      throw new AppError('Email and message are required', 400);
    }

    return await formRepository.create(formData);
  }
}

export default new FormService();
