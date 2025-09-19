import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorDisplay } from "@/components/ui/error-display";

describe("ErrorDisplay", () => {
  it("renders error message correctly", () => {
    render(<ErrorDisplay message="Test error" severity="error" />);
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders details when provided", () => {
    render(
      <ErrorDisplay
        message="Test error"
        severity="error"
        details="Error details"
      />
    );
    expect(screen.getByText("Error details")).toBeInTheDocument();
  });

  it("calls onDismiss when close button is clicked", () => {
    const onDismiss = jest.fn();
    render(
      <ErrorDisplay
        message="Test error"
        severity="error"
        onDismiss={onDismiss}
      />
    );

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("applies correct styles based on severity", () => {
    const { rerender } = render(
      <ErrorDisplay message="Test error" severity="error" />
    );
    expect(screen.getByRole("alert")).toHaveClass("border-destructive");

    rerender(<ErrorDisplay message="Test warning" severity="warning" />);
    expect(screen.getByRole("alert")).toHaveClass("border-warning");

    rerender(<ErrorDisplay message="Test info" severity="info" />);
    expect(screen.getByRole("alert")).toHaveClass("border-info");
  });
});
