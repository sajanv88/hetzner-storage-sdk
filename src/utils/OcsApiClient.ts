import axios, { AxiosInstance } from 'axios';
import {
  OCSShareResponse,
  OCSShareData,
  CreateShareOptions,
  StorageError,
} from '../types';

/**
 * Client for interacting with Nextcloud OCS API (for Storage Share)
 */
export class OcsApiClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(instance: string, username: string, password: string) {
    this.username = username;
    this.password = password;
    this.baseUrl = `https://${instance}.your-storageshare.de`;

    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/ocs/v2.php/apps/files_sharing/api/v1`,
      auth: {
        username: this.username,
        password: this.password,
      },
      headers: {
        'OCS-APIRequest': 'true',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        format: 'json',
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Check OCS status
        if (response.data?.ocs?.meta?.statuscode >= 400) {
          const error: StorageError = new Error(
            response.data.ocs.meta.message || 'OCS API error'
          );
          error.code = `OCS_${response.data.ocs.meta.statuscode}`;
          error.statusCode = response.data.ocs.meta.statuscode;
          error.response = response.data;
          throw error;
        }
        return response;
      },
      (error) => {
        const storageError: StorageError = new Error(
          error.response?.data?.ocs?.meta?.message ||
            error.response?.data?.message ||
            error.message
        );
        storageError.code = error.code;
        storageError.statusCode = error.response?.status;
        storageError.response = error.response?.data;
        throw storageError;
      }
    );
  }

  /**
   * List all active shares
   */
  async listShares(): Promise<OCSShareData[]> {
    const response = await this.axiosInstance.get<OCSShareResponse>('/shares');
    const data = response.data.ocs.data;
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Create a new share (link, user, or group)
   * @param options - Share creation options
   */
  async createShare(options: CreateShareOptions): Promise<OCSShareData> {
    const params = new URLSearchParams();
    params.append('path', options.path);
    params.append('shareType', options.shareType.toString());

    if (options.shareWith) {
      params.append('shareWith', options.shareWith);
    }
    if (options.permissions !== undefined) {
      params.append('permissions', options.permissions.toString());
    }
    if (options.password) {
      params.append('password', options.password);
    }
    if (options.expireDate) {
      params.append('expireDate', options.expireDate);
    }
    if (options.note) {
      params.append('note', options.note);
    }
    if (options.label) {
      params.append('label', options.label);
    }

    const response = await this.axiosInstance.post<OCSShareResponse>(
      '/shares',
      params.toString()
    );
    return response.data.ocs.data as OCSShareData;
  }

  /**
   * Get details of a specific share
   * @param shareId - The ID of the share
   */
  async getShare(shareId: string): Promise<OCSShareData> {
    const response = await this.axiosInstance.get<OCSShareResponse>(
      `/shares/${shareId}`
    );
    const data = response.data.ocs.data;
    return Array.isArray(data) ? data[0] : data;
  }

  /**
   * Update an existing share
   * @param shareId - The ID of the share
   * @param options - Share update options (partial)
   */
  async updateShare(
    shareId: string,
    options: Partial<CreateShareOptions>
  ): Promise<OCSShareData> {
    const params = new URLSearchParams();

    if (options.permissions !== undefined) {
      params.append('permissions', options.permissions.toString());
    }
    if (options.password !== undefined) {
      params.append('password', options.password);
    }
    if (options.expireDate !== undefined) {
      params.append('expireDate', options.expireDate);
    }
    if (options.note !== undefined) {
      params.append('note', options.note);
    }
    if (options.label !== undefined) {
      params.append('label', options.label);
    }

    const response = await this.axiosInstance.put<OCSShareResponse>(
      `/shares/${shareId}`,
      params.toString()
    );
    return response.data.ocs.data as OCSShareData;
  }

  /**
   * Delete a specific share
   * @param shareId - The ID of the share to delete
   */
  async deleteShare(shareId: string): Promise<void> {
    await this.axiosInstance.delete(`/shares/${shareId}`);
  }

  /**
   * Get shares for a specific file or folder
   * @param path - The path to get shares for
   */
  async getSharesForPath(path: string): Promise<OCSShareData[]> {
    const response = await this.axiosInstance.get<OCSShareResponse>('/shares', {
      params: {
        path,
        format: 'json',
      },
    });
    const data = response.data.ocs.data;
    return Array.isArray(data) ? data : data ? [data] : [];
  }
}
