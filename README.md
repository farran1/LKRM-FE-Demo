# Express.js API Backend

A modern Express.js API backend with PostgreSQL and Redis, built with TypeScript and following best practices.

## Features

- TypeScript support
- PostgreSQL database integration
- Redis caching
- File upload handling with Multer
- CORS enabled
- Input validation
- Dependency injection
- Singleton pattern implementation
- MVC architecture

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Redis

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=express_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=5242880
   ```

## Development

Run the development server:
```bash
npm run dev
```

## Building for Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middlewares/    # Custom middlewares
├── models/         # Database models
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
└── app.ts          # Application entry point
```

## API Response Format

All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}|[]|null
}
```

## Error Handling

The application includes global error handling middleware that returns errors in a consistent format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## File Upload

The application supports file uploads with the following features:
- File size limit: 5MB (configurable)
- Supported file types: JPEG, PNG, GIF, PDF
- Files are stored in the `uploads` directory
- Unique filenames to prevent conflicts

## License

ISC 