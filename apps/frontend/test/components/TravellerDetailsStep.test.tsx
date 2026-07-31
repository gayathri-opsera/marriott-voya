import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../utils/render";
import { TravellerDetailsStep } from "@/components/checkout/TravellerDetailsStep";

describe("TravellerDetailsStep", () => {
  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TravellerDetailsStep onSubmit={() => {}} onBack={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Continue to payment" }));

    expect(screen.getByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  it("submits valid traveller details", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<TravellerDetailsStep onSubmit={onSubmit} onBack={() => {}} />);

    await user.type(screen.getByLabelText("First name"), "Jane");
    await user.type(screen.getByLabelText("Last name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Phone"), "1234567890");
    await user.type(screen.getByLabelText("Passport number"), "AB1234567");
    await user.click(screen.getByRole("button", { name: "Continue to payment" }));

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "1234567890",
      passportNumber: "AB1234567",
    });
  });
});
