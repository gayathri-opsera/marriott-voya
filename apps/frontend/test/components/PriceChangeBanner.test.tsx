import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../utils/render";
import { PriceChangeBanner } from "@/components/checkout/PriceChangeBanner";

describe("PriceChangeBanner", () => {
  it("renders old and new prices with alert role", () => {
    renderWithProviders(
      <PriceChangeBanner
        originalPrice="450.00"
        newPrice="499.00"
        currency="USD"
        onAccept={() => {}}
        onDecline={() => {}}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("$450.00")).toBeInTheDocument();
    expect(screen.getByText("$499.00")).toBeInTheDocument();
  });

  it("calls accept and decline handlers", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    renderWithProviders(
      <PriceChangeBanner
        originalPrice="450.00"
        newPrice="499.00"
        currency="USD"
        onAccept={onAccept}
        onDecline={onDecline}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Accept new price" }));
    expect(onAccept).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(onDecline).toHaveBeenCalledOnce();
  });
});
