/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoyaltyAccrual } from "../../components/trips/LoyaltyAccrual";

describe("LoyaltyAccrual", () => {
  it("shows approximate points with info for illustrative accrual", () => {
    render(<LoyaltyAccrual points={1500} isIllustrative programName="Bonvoy" />);
    expect(screen.getByTestId("loyalty-accrual")).toHaveTextContent("≈ 1,500 pts");
    expect(screen.getByLabelText("Loyalty estimate only")).toBeInTheDocument();
  });

  it("shows exact points with program badge for real accrual", () => {
    render(<LoyaltyAccrual points={2500} isIllustrative={false} programName="Bonvoy" />);
    expect(screen.getByText("2,500 pts")).toBeInTheDocument();
    expect(screen.getByText("Bonvoy")).toBeInTheDocument();
  });

  it("formats large point values with locale separators", () => {
    render(<LoyaltyAccrual points={12500} isIllustrative={false} programName="Bonvoy" />);
    expect(screen.getByText("12,500 pts")).toBeInTheDocument();
  });
});
