import axios, { AxiosError, AxiosInstance } from "axios";
import { useErrorToast } from "@/hooks/use-error-toast";

interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError<ApiError>): void {
    const { showErrorToast } = useErrorToast();

    if (error.response) {
      const apiError = error.response.data;
      showErrorToast(apiError.message || "An unexpected error occurred", {
        title: `Error ${error.response.status}`,
        description: apiError.details
          ? JSON.stringify(apiError.details)
          : undefined,
      });
    } else if (error.request) {
      showErrorToast("Network error - unable to reach the server", {
        title: "Network Error",
      });
    } else {
      showErrorToast(error.message || "An unexpected error occurred", {
        title: "Error",
      });
    }
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
