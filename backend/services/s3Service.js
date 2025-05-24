import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client, { s3Config } from '../config/aws.js';

class S3Service {
    async uploadPDF(file, key) {
        try {
            const command = new PutObjectCommand({
                Bucket: s3Config.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            });

            await s3Client.send(command);
            return {
                success: true,
                key: key,
                url: `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`
            };
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    async getSignedUrl(key) {
        try {
            const command = new GetObjectCommand({
                Bucket: s3Config.bucketName,
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

export default new S3Service(); 