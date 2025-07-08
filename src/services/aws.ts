import { S3Client } from "@aws-sdk/client-s3"

export const s3 = new S3Client({
  region: process.env.AWS_REGION
})

export const S3_BUCKET = process.env.AWS_S3_BUCKET