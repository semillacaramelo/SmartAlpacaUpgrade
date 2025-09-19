import { renderHook, act } from "@testing-library/react";
import { useErrorToast } from "@/hooks/use-error-toast";
import { useToast } from "@/hooks/use-toast";

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

describe("useErrorToast", () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    mockToast.mockClear();
  });

  it("shows error toast with default options", () => {
    const { result } = renderHook(() => useErrorToast());

    act(() => {
      result.current.showErrorToast("Test error message");
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Test error message",
      duration: 5000,
      variant: "destructive",
      icon: expect.any(Object),
    });
  });

  it("shows warning toast with custom options", () => {
    const { result } = renderHook(() => useErrorToast());

    act(() => {
      result.current.showWarningToast("Test warning", {
        title: "Custom Warning",
        duration: 3000,
      });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Custom Warning",
      description: "Test warning",
      duration: 3000,
      variant: "warning",
      icon: expect.any(Object),
    });
  });

  it("shows info toast with default options", () => {
    const { result } = renderHook(() => useErrorToast());

    act(() => {
      result.current.showInfoToast("Test info message");
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Info",
      description: "Test info message",
      duration: 5000,
      variant: "default",
      icon: expect.any(Object),
    });
  });
});
