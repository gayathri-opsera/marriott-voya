import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "../../src/primitives/Input";
import { renderWithProviders } from "../utils/render";

describe("Input", () => {
  it("renders an input element", () => {
    renderWithProviders(<Input placeholder="Search destinations" />);
    expect(screen.getByPlaceholderText("Search destinations")).toBeInTheDocument();
  });

  it("sets aria-invalid when error is present", () => {
    renderWithProviders(<Input error="Required field" aria-label="Origin" />);
    expect(screen.getByRole("textbox", { name: "Origin" })).toHaveAttribute("aria-invalid", "true");
  });

  it("associates label via htmlFor", () => {
    renderWithProviders(<Input label="Destination" />);
    const input = screen.getByLabelText("Destination");
    expect(input).toBeInTheDocument();
    expect(input.id).toBeTruthy();
  });

  it("renders error message linked by aria-describedby", () => {
    renderWithProviders(<Input label="Email" error="Invalid email" />);
    const input = screen.getByLabelText("Email");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!.split(" ").pop()!)).toHaveTextContent("Invalid email");
  });
});
