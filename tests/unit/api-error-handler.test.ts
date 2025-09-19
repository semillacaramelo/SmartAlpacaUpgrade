import { ApiErrorHandler } from "@/lib/api-error-handler";
import { useErrorToast } from "@/hooks/use-error-toast";
import axios, { AxiosError } from "axios";

jest.mock("@/hooks/use-error-toast");
jest.mock("axios");

describe("ApiErrorHandler", () => {
  const mockShowErrorToast = jest.fn();

  beforeEach(() => {
    (useErrorToast as jest.Mock).mockReturnValue({
      showErrorToast: mockShowErrorToast,
    });
    mockShowErrorToast.mockClear();
  });

  it("handles API response errors", async () => {
    const errorResponse = {
      response: {
        status: 400,
        data: {
          message: "Invalid request",
          details: { field: "email", error: "Invalid format" },
        },
      },
    };

    const handler = ApiErrorHandler.getInstance();
    const instance = handler.getAxiosInstance();

    // Simulate a failed request
    await instance.interceptors.response.handlers[0].rejected(
      errorResponse as AxiosError
    );

    expect(mockShowErrorToast).toHaveBeenCalledWith("Invalid request", {
      title: "Error 400",
      description: JSON.stringify({ field: "email", error: "Invalid format" }),
    });
  });

  it("handles network errors", async () => {
    const networkError = {
      request: {},
      message: "Network Error",
    };

    const handler = ApiErrorHandler.getInstance();
    const instance = handler.getAxiosInstance();

    await instance.interceptors.response.handlers[0].rejected(
      networkError as AxiosError
    );

    expect(mockShowErrorToast).toHaveBeenCalledWith(
      "Network error - unable to reach the server",
      { title: "Network Error" }
    );
  });

  it("handles unknown errors", async () => {
    const unknownError = {
      message: "Unknown error occurred",
    };

    const handler = ApiErrorHandler.getInstance();
    const instance = handler.getAxiosInstance();

    await instance.interceptors.response.handlers[0].rejected(
      unknownError as AxiosError
    );

    expect(mockShowErrorToast).toHaveBeenCalledWith("Unknown error occurred", {
      title: "Error",
    });
  });
});
