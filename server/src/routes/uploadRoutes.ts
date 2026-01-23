import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { storageService } from '../services/storageService';
import { uploadLogger } from '../utils/logger';

const router = express.Router();

// Extend Request type to include auth
interface AuthRequest extends Request {
    auth?: {
        userId: string;
    };
}

// Ensure uploads directory exists (fallback for local storage)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * GET /api/upload/status
 * Check if R2 storage is configured
 */
router.get('/status', (req: AuthRequest, res: Response) => {
    res.json({
        configured: storageService.isConfigured(),
        message: storageService.isConfigured()
            ? 'R2 storage is ready'
            : 'R2 storage is not configured. Using local fallback.',
    });
});

/**
 * POST /api/upload/presign
 * Get a presigned URL for client-side upload to R2
 * Body: { filename: string, mimeType: string, folder?: string }
 */
router.post('/presign', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!storageService.isConfigured()) {
            return res.status(503).json({
                error: 'R2 storage not configured',
                fallback: 'local'
            });
        }

        const { filename, mimeType, folder } = req.body;

        if (!filename || !mimeType) {
            return res.status(400).json({ error: 'filename and mimeType are required' });
        }

        // Validate mime type
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv',
            'application/zip', 'application/x-zip-compressed',
        ];

        if (!allowedTypes.includes(mimeType)) {
            return res.status(400).json({ error: `File type ${mimeType} is not allowed` });
        }

        const maxSize = 50 * 1024 * 1024; // 50MB

        const result = await storageService.getPresignedUploadUrl(
            userId,
            filename,
            mimeType,
            folder || 'uploads'
        );

        res.json({
            ...result,
            maxSize,
            expiresIn: 3600,
        });
    } catch (error) {
        uploadLogger.error('Presign error:', error);
        const message = error instanceof Error ? error.message : 'Failed to generate upload URL';
        res.status(500).json({ error: message });
    }
});

/**
 * POST /api/upload/confirm
 * Confirm that a file was uploaded successfully
 * Body: { key: string, size: number }
 */
router.post('/confirm', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { key, size } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'key is required' });
        }

        // Verify the key belongs to this user
        if (!key.includes(`/${userId}/`)) {
            return res.status(403).json({ error: 'Access denied to this file' });
        }

        const fileInfo = storageService.getFileInfo(key);

        res.json({
            success: true,
            file: {
                ...fileInfo,
                size,
            },
        });
    } catch (error) {
        uploadLogger.error('Confirm error:', error);
        const message = error instanceof Error ? error.message : 'Failed to confirm upload';
        res.status(500).json({ error: message });
    }
});

/**
 * GET /api/upload/list
 * List files for the current user
 * Query: { folder?: string }
 */
router.get('/list', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!storageService.isConfigured()) {
            return res.json({ files: [], message: 'R2 not configured' });
        }

        const folder = (req.query.folder as string) || 'uploads';
        const files = await storageService.listFiles(userId, folder);

        res.json({
            files: files.map(key => storageService.getFileInfo(key)),
        });
    } catch (error) {
        uploadLogger.error('List error:', error);
        const message = error instanceof Error ? error.message : 'Failed to list files';
        res.status(500).json({ error: message });
    }
});

/**
 * DELETE /api/upload/file/:key(*)
 * Delete a file from R2 storage
 */
router.delete('/file/{*path}', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const pathParam = req.params.path;
        const key = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;

        if (!key) {
            return res.status(400).json({ error: 'File key is required' });
        }

        // Verify the key belongs to this user
        if (!key.includes(`/${userId}/`)) {
            return res.status(403).json({ error: 'Access denied to this file' });
        }

        await storageService.deleteFile(key);

        res.json({ success: true });
    } catch (error) {
        uploadLogger.error('Delete error:', error);
        const message = error instanceof Error ? error.message : 'Failed to delete file';
        res.status(500).json({ error: message });
    }
});

/**
 * POST /api/upload
 * Legacy local upload endpoint (base64 images)
 * Kept for backward compatibility
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        const { image, filename } = req.body;

        if (!image || !filename) {
            return res.status(400).json({ error: 'Missing image data or filename' });
        }

        // Extract base64 data (remove "data:image/png;base64," prefix)
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        let buffer: Buffer;
        let mimeType = 'image/png';

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(image, 'base64');
        }

        // If R2 is configured, upload there
        if (storageService.isConfigured() && userId) {
            try {
                const result = await storageService.uploadFile(
                    userId,
                    buffer,
                    filename,
                    mimeType,
                    'images'
                );
                return res.json({ url: result.url, key: result.key });
            } catch (r2Error) {
                uploadLogger.error('R2 upload failed, falling back to local:', r2Error);
                // Fall through to local storage
            }
        }

        // Local storage fallback
        const uniqueName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const filePath = path.join(uploadDir, uniqueName);

        fs.writeFileSync(filePath, buffer);

        res.json({ url: `/uploads/${uniqueName}` });

    } catch (e) {
        uploadLogger.error('Upload error', e);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

export default router;
