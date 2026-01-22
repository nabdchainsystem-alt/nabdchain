import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nabdchain-files';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Validate R2 configuration
const isR2Configured = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

// Initialize S3 client for R2 (only if configured)
const s3Client = isR2Configured ? new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
}) : null;

export interface UploadResult {
    key: string;
    url: string;
    size: number;
    mimeType: string;
}

export interface PresignedUrlResult {
    uploadUrl: string;
    publicUrl: string;
    key: string;
}

/**
 * Generate a unique file key with organized folder structure
 */
const generateFileKey = (userId: string, originalFilename: string, folder: string = 'uploads'): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${userId}/${timestamp}-${randomId}-${sanitizedFilename}`;
};

/**
 * Get the public URL for a file
 */
const getPublicUrl = (key: string): string => {
    if (R2_PUBLIC_URL) {
        return `${R2_PUBLIC_URL}/${key}`;
    }
    // Fallback to presigned URL if no public URL configured
    return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
};

export const storageService = {
    /**
     * Check if R2 storage is configured
     */
    isConfigured: (): boolean => {
        return isR2Configured;
    },

    /**
     * Generate a presigned URL for client-side upload
     */
    getPresignedUploadUrl: async (
        userId: string,
        filename: string,
        mimeType: string,
        folder: string = 'uploads'
    ): Promise<PresignedUrlResult> => {
        if (!s3Client) {
            throw new Error('R2 storage is not configured');
        }

        const key = generateFileKey(userId, filename, folder);

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: mimeType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry

        return {
            uploadUrl,
            publicUrl: getPublicUrl(key),
            key,
        };
    },

    /**
     * Upload a file directly from the server
     */
    uploadFile: async (
        userId: string,
        file: Buffer,
        filename: string,
        mimeType: string,
        folder: string = 'uploads'
    ): Promise<UploadResult> => {
        if (!s3Client) {
            throw new Error('R2 storage is not configured');
        }

        const key = generateFileKey(userId, filename, folder);

        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: mimeType,
        }));

        return {
            key,
            url: getPublicUrl(key),
            size: file.length,
            mimeType,
        };
    },

    /**
     * Get a presigned URL for downloading a private file
     */
    getSignedDownloadUrl: async (key: string, expiresIn: number = 3600): Promise<string> => {
        if (!s3Client) {
            throw new Error('R2 storage is not configured');
        }

        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        return getSignedUrl(s3Client, command, { expiresIn });
    },

    /**
     * Delete a file from storage
     */
    deleteFile: async (key: string): Promise<void> => {
        if (!s3Client) {
            throw new Error('R2 storage is not configured');
        }

        await s3Client.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        }));
    },

    /**
     * List files for a user in a specific folder
     */
    listFiles: async (userId: string, folder: string = 'uploads'): Promise<string[]> => {
        if (!s3Client) {
            throw new Error('R2 storage is not configured');
        }

        const prefix = `${folder}/${userId}/`;

        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: prefix,
        }));

        return (response.Contents || []).map(item => item.Key!).filter(Boolean);
    },

    /**
     * Get file metadata
     */
    getFileInfo: (key: string) => {
        return {
            key,
            publicUrl: getPublicUrl(key),
            bucket: R2_BUCKET_NAME,
        };
    },
};
