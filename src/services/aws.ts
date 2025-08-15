// Mock AWS S3 client for frontend static export
export const s3 = {
  send: async (command: any) => {
    // Mock S3 response
    return {
      ETag: '"mock-etag"',
      Location: 'https://mock-bucket.s3.amazonaws.com/mock-file.jpg',
      Key: 'mock-file.jpg',
      Bucket: 'mock-bucket'
    };
  }
};

export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'mock-bucket'