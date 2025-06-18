import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client } from '@aws-sdk/client-s3';
import s3Config from '../config/aws.js';
import dotenv from 'dotenv';

dotenv.config();

// Validate AWS configuration
if (!process.env.AWS_BUCKET_NAME) {
    console.error('AWS_BUCKET_NAME is not set in environment variables');
    process.exit(1);
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS credentials are not set in environment variables');
    process.exit(1);
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

class S3Service {
    async uploadPDF(file, key) {
        try {
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            });

            await s3Client.send(command);
            return {
                success: true,
                key: key,
                url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
            };
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    async getSignedUrl(key) {
        try {
            const command = new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
            });

            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return signedUrl;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Failed to generate signed URL');
        }
    }

    generateKey(fileName, prefix = 'documents') {
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${prefix}/${timestamp}-${sanitizedFileName}`;
    }
}

const s3Service = new S3Service();

// Export both the service instance and the uploadToS3 function
export const uploadToS3 = async (file, folder) => {
    try {
        const key = s3Service.generateKey(file.originalname, folder);
        const result = await s3Service.uploadPDF(file, key);
        return result.url;
    } catch (error) {
        console.error('Error in uploadToS3:', error);
        throw error;
    }
};

export default s3Service; 