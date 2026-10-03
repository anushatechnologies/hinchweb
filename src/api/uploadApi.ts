import { apiClient } from '../services/apiClient';
import type { UploadResponse } from '../types';

export type UploadFolder = 'kyc' | 'rfq' | 'mtc' | 'products';

export const uploadApi = {
  /**
   * Upload a file or document (PDF, PNG, JPG, WEBP up to 15MB)
   * Endpoint: POST /upload (alias: POST /documents/upload)
   */
  async uploadFile(file: File, folder: UploadFolder = 'kyc'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await apiClient.post('/upload', formData, {
      headers: {
        // Let the browser set the boundary automatically
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data?.success && (res.data?.url || res.data?.fileUrl)) {
      return {
        success: true,
        statusCode: res.data.statusCode || 200,
        message: res.data.message || 'File uploaded successfully',
        url: res.data.url || res.data.fileUrl,
        fileUrl: res.data.fileUrl || res.data.url,
        fileName: res.data.fileName || file.name,
        fileSize: res.data.fileSize || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        sizeBytes: res.data.sizeBytes || file.size,
      };
    }

    if (res.data?.url || res.data?.fileUrl) {
      return {
        success: true,
        url: res.data.url || res.data.fileUrl,
        fileUrl: res.data.fileUrl || res.data.url,
        fileName: res.data.fileName || file.name,
        fileSize: res.data.fileSize || '',
      };
    }

    throw new Error(res.data?.message || 'File upload failed');
  },
};
