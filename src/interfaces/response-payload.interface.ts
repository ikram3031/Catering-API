export interface ResponsePayload {
  success: boolean;
  data?: any;
  count?: number;
  message?: string;
  reports?: any;
}

export interface ImageUploadResponse {
  name: string;
  size: number;
  url: string;
}
