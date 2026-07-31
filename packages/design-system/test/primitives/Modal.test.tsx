import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../../src/primitives/Modal";
import { renderWithProviders } from "../utils/render";

describe("Modal", () => {
  it("renders title when open", () => {
    renderWithProviders(
      <Modal open title="Confirm booking" onOpenChange={() => {}}>
        <p>Details</p>
      </Modal>,
    );
    expect(screen.getByRole("heading", { name: "Confirm booking" })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    renderWithProviders(
      <Modal
        open
        title="Confirm booking"
        description="Review your trip details"
        onOpenChange={() => {}}
      />,
    );
    expect(screen.getByText("Review your trip details")).toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Modal open title="Confirm booking" onOpenChange={onOpenChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
