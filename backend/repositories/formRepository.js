import Form from '../models/formModel.js';

class FormRepository {
  async create(formData) {
    const form = new Form(formData);
    return await form.save();
  }
}

export default new FormRepository();
