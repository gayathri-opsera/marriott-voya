import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBanner } from "../../src/primitives/ErrorBanner";
import { renderWithProviders } from "../utils/render";

describe("ErrorBanner", () => {
  it("renders nothing when error is null", () => {
    const { container } = renderWithProviders(<ErrorBanner error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows field name with message when field is present", () => {
    renderWithProviders(
      <ErrorBanner error={{ message: "Invalid code", field: "origin", code: "VALIDATION_FAILED" }} />,
    );
    expect(screen.getByTestId("error-message")).toHaveTextContent("origin:");
    expect(screen.getByTestId("error-message")).toHaveTextContent("Invalid code");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
