import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../../src/primitives/Button";
import { renderWithProviders } from "../utils/render";

describe("Button", () => {
  it("renders children", () => {
    renderWithProviders(<Button>Book now</Button>);
    expect(screen.getByRole("button", { name: "Book now" })).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    renderWithProviders(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-danger");
  });

  it("sets aria-disabled when disabled", () => {
    renderWithProviders(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });

  it("shows spinner and aria-busy when loading", () => {
    renderWithProviders(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("[aria-hidden]")).toBeTruthy();
  });
});

describe("Button asChild", () => {
  it("renders as child element", async () => {
    renderWithProviders(
      <Button asChild variant="link">
        <a href="/search">Search</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Search" })).toBeInTheDocument();
  });
});
