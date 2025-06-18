import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// Log environment variables for debugging
console.log('AWS Configuration:', {
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_BUCKET_NAME,
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export const s3Config = {
    bucketName: process.env.AWS_BUCKET_NAME,
    region: process.env.AWS_REGION || 'us-east-1'
};

export default s3Client; 