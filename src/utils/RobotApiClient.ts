import axios, { type AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
    SnapshotInfo,
    SnapshotListResponse,
    StorageBoxDetails,
    StorageBoxListResponse,
    StorageBoxServiceToggle,
    StorageError,
} from '../types';

/**
 * Client for interacting with Hetzner Robot API
 */
export class RobotApiClient {
    private axiosInstance: AxiosInstance;
    private username: string;
    private password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;

        this.axiosInstance = axios.create({
            baseURL: 'https://robot-ws.your-server.de',
            auth: {
                username: this.username,
                password: this.password,
            },
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                const storageError: StorageError = new Error(
                    error.response?.data?.error?.message || error.message
                );
                storageError.code = error.response?.data?.error?.code || error.code;
                storageError.statusCode = error.response?.status;
                storageError.response = error.response?.data;
                throw storageError;
            }
        );
    }

    /**
     * Get a list of all storage boxes
     */
    async listStorageBoxes(): Promise<StorageBoxDetails[]> {
        const response = await this.axiosInstance.get<StorageBoxListResponse>('/storagebox');
        return response.data.storagebox;
    }

    /**
     * Get details for a specific storage box
     * @param storageBoxId - The ID of the storage box
     */
    async getStorageBox(storageBoxId: string): Promise<StorageBoxDetails> {
        const response = await this.axiosInstance.get<{
            storagebox: StorageBoxDetails;
        }>(`/storagebox/${storageBoxId}`);
        return response.data.storagebox;
    }

    /**
     * Toggle services on a storage box (SSH, Samba, WebDAV)
     * @param storageBoxId - The ID of the storage box
     * @param services - Services to enable/disable
     */
    async toggleServices(
        storageBoxId: string,
        services: StorageBoxServiceToggle
    ): Promise<StorageBoxDetails> {
        const response = await this.axiosInstance.patch<{
            storagebox: StorageBoxDetails;
        }>(`/storagebox/${storageBoxId}`, {
            storagebox: services,
        });
        return response.data.storagebox;
    }

    /**
     * Create a snapshot of the storage box filesystem
     * @param storageBoxId - The ID of the storage box
     * @param comment - Optional comment for the snapshot
     */
    async createSnapshot(storageBoxId: string, comment?: string): Promise<SnapshotInfo> {
        const payload: any = {};
        if (comment) {
            payload.comment = comment;
        }

        const response = await this.axiosInstance.post<{
            snapshot: SnapshotInfo;
        }>(`/storagebox/${storageBoxId}/snapshot`, payload);
        return response.data.snapshot;
    }

    /**
     * List all snapshots for a storage box
     * @param storageBoxId - The ID of the storage box
     */
    async listSnapshots(storageBoxId: string): Promise<SnapshotInfo[]> {
        const response = await this.axiosInstance.get<SnapshotListResponse>(
            `/storagebox/${storageBoxId}/snapshot`
        );
        return response.data.snapshot;
    }

    /**
     * Delete a specific snapshot
     * @param storageBoxId - The ID of the storage box
     * @param snapshotName - The name of the snapshot to delete
     */
    async deleteSnapshot(storageBoxId: string, snapshotName: string): Promise<void> {
        await this.axiosInstance.delete(`/storagebox/${storageBoxId}/snapshot/${snapshotName}`);
    }

    /**
     * Revert storage box to a specific snapshot
     * @param storageBoxId - The ID of the storage box
     * @param snapshotName - The name of the snapshot to revert to
     */
    async revertToSnapshot(storageBoxId: string, snapshotName: string): Promise<void> {
        await this.axiosInstance.post(
            `/storagebox/${storageBoxId}/snapshot/${snapshotName}/revert`
        );
    }
}
