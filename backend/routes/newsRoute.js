import express from 'express';
import { submitNewsletter } from '../controllers/newsController.js';

const newsrouter = express.Router();

newsrouter.post('/newsdata', submitNewsletter);

export default newsrouter;