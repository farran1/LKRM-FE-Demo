// Mock multer for frontend static export
import path from 'path';
import { Request } from 'express';

// Extend Express Request to include file property
interface RequestWithFile extends Request {
  file?: MockMulterFile;
}

// Mock multer types
interface MockMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Mock multer middleware
const mockMulter = (options: any) => {
  const middleware = (req: RequestWithFile, res: any, next: any) => {
    // Mock file object
    req.file = {
      fieldname: 'file',
      originalname: 'mock-file.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      destination: 'uploads/',
      filename: 'mock-file.jpg',
      path: 'uploads/mock-file.jpg',
      buffer: Buffer.from('mock')
    };
    next();
  };
  
  // Add single method to match multer API
  middleware.single = (fieldName: string) => middleware;
  
  return middleware;
};

// Mock storage
const storage = {
  destination: (req: RequestWithFile, file: MockMulterFile, cb: any) => {
    cb(null, 'uploads/');
  },
  filename: (req: RequestWithFile, file: MockMulterFile, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
};

const imageFilter = (req: RequestWithFile, file: MockMulterFile, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG files are allowed.'));
  }
};

export const imageUpload = mockMulter({
  storage: 'memory',
  fileFilter: imageFilter,
  limits: { fileSize: 5242880 }
});

const excelFilter = (req: RequestWithFile, file: MockMulterFile, cb: any) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed!'));
  }
}

export const excelUpload = mockMulter({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: excelFilter
})
