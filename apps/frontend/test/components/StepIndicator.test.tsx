import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../utils/render";
import { StepIndicator } from "@/components/checkout/StepIndicator";

const STEPS = ["Review", "Traveller Details", "Payment", "Confirmation"];

describe("StepIndicator", () => {
  it("renders all steps", () => {
    renderWithProviders(<StepIndicator steps={STEPS} currentStep={0} />);
    for (const step of STEPS) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  it("marks the current step with aria-current", () => {
    renderWithProviders(<StepIndicator steps={STEPS} currentStep={2} />);
    const current = screen.getByText("Payment").closest("[aria-current='step']");
    expect(current).toBeInTheDocument();
  });
});
