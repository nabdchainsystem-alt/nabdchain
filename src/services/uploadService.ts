import { API_URL } from '../config/api';

const UPLOAD_API = `${API_URL}/upload`;

export interface PresignedUploadResponse {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    maxSize: number;
    expiresIn: number;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface UploadResult {
    url: string;
    key: string;
}

/**
 * Check if R2 storage is configured on the server
 */
export const checkStorageStatus = async (token: string): Promise<{ configured: boolean; message: string }> => {
    const response = await fetch(`${UPLOAD_API}/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
};

/**
 * Get a presigned URL for uploading a file directly to R2
 */
export const getPresignedUrl = async (
    token: string,
    filename: string,
    mimeType: string,
    folder?: string
): Promise<PresignedUploadResponse> => {
    const response = await fetch(`${UPLOAD_API}/presign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ filename, mimeType, folder }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get upload URL');
    }

    return response.json();
};

/**
 * Upload a file directly to R2 using the presigned URL
 * Supports progress tracking
 */
export const uploadToR2 = async (
    presignedUrl: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress({
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                });
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Upload was cancelled'));
        });

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
};

/**
 * Confirm that an upload was successful (optional tracking)
 */
export const confirmUpload = async (
    token: string,
    key: string,
    size: number
): Promise<{ success: boolean; file: { key: string; publicUrl: string; size: number } }> => {
    const response = await fetch(`${UPLOAD_API}/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key, size }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm upload');
    }

    return response.json();
};

/**
 * Delete a file from R2 storage
 */
export const deleteFile = async (token: string, key: string): Promise<void> => {
    const response = await fetch(`${UPLOAD_API}/file/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete file');
    }
};

/**
 * Complete upload flow: get presigned URL, upload file, and return the public URL
 */
export const uploadFile = async (
    token: string,
    file: File,
    options?: {
        folder?: string;
        onProgress?: (progress: UploadProgress) => void;
    }
): Promise<UploadResult> => {
    // 1. Get presigned URL
    const presigned = await getPresignedUrl(
        token,
        file.name,
        file.type,
        options?.folder
    );

    // 2. Validate file size
    if (file.size > presigned.maxSize) {
        throw new Error(`File size exceeds maximum allowed (${Math.round(presigned.maxSize / 1024 / 1024)}MB)`);
    }

    // 3. Upload to R2
    await uploadToR2(presigned.uploadUrl, file, options?.onProgress);

    // 4. Return the result
    return {
        url: presigned.publicUrl,
        key: presigned.key,
    };
};

/**
 * Upload multiple files concurrently
 */
export const uploadFiles = async (
    token: string,
    files: File[],
    options?: {
        folder?: string;
        onFileProgress?: (fileIndex: number, progress: UploadProgress) => void;
        onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    }
): Promise<UploadResult[]> => {
    const results = await Promise.all(
        files.map(async (file, index) => {
            const result = await uploadFile(token, file, {
                folder: options?.folder,
                onProgress: (progress) => options?.onFileProgress?.(index, progress),
            });
            options?.onFileComplete?.(index, result);
            return result;
        })
    );

    return results;
};

/**
 * Legacy upload function (base64 images to server)
 * Kept for backward compatibility - server will use R2 if configured
 */
export const uploadBase64Image = async (
    token: string,
    base64Data: string,
    filename: string
): Promise<UploadResult> => {
    const response = await fetch(UPLOAD_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64Data, filename }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
    }

    return response.json();
};

export const uploadService = {
    checkStatus: checkStorageStatus,
    getPresignedUrl,
    uploadToR2,
    confirmUpload,
    deleteFile,
    uploadFile,
    uploadFiles,
    uploadBase64Image,
};

export default uploadService;
