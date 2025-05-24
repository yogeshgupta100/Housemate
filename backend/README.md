# Housemate Backend

This is the backend server for the Housemate property listing application. It provides APIs for managing properties, user authentication, and image uploads.

## Features

- User authentication with JWT
- Property listing management (CRUD operations)
- Image upload with Cloudinary integration
- Role-based access control
- Error handling middleware
- Input validation
- File upload handling with Multer

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
Copy the `.env.example` file to `.env` and update the values:
```bash
cp .env.example .env
```

Update the following variables in your `.env` file:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure secret key for JWT
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

4. Create uploads directory:
```bash
mkdir uploads
mkdir uploads/properties
```

5. Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:5000 by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties (with pagination and filters)
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create new property (requires authentication)
- `PUT /api/properties/:id` - Update property (requires authentication)
- `DELETE /api/properties/:id` - Delete property (requires authentication)
- `GET /api/properties/featured` - Get featured properties
- `GET /api/properties/category/:category` - Get properties by category
- `GET /api/properties/user/properties` - Get user's properties (requires authentication)

## File Structure

```
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   └── propertyController.js
├── middleware/
│   ├── auth.js
│   └── error.js
├── models/
│   ├── propertyModel.js
│   └── Usermodel.js
├── routes/
│   ├── authRoutes.js
│   └── propertyRoutes.js
├── utils/
│   ├── cloudinary.js
│   └── validation.js
├── uploads/
│   └── properties/
├── .env
├── .env.example
├── app.js
└── package.json
```

## Error Handling

The application includes a centralized error handling middleware that processes:
- Validation errors
- Database errors
- Authentication errors
- File upload errors
- Custom errors

## Image Upload

Images are handled in two steps:
1. Files are temporarily stored using Multer
2. Images are uploaded to Cloudinary for permanent storage

Maximum file size: 5MB
Allowed formats: JPEG, JPG, PNG, WEBP
Maximum files per upload: 5

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 