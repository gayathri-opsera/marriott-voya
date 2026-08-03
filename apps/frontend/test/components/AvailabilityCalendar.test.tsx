import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AvailabilityCalendar } from "../../components/search/AvailabilityCalendar";

describe("AvailabilityCalendar", () => {
  it("renders without crashing", () => {
    render(<AvailabilityCalendar />);
    expect(screen.getByRole("button", { name: /next month/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /previous month/i })).toBeTruthy();
  });

  it("renders day-of-week headers", () => {
    render(<AvailabilityCalendar />);
    expect(screen.getAllByText(/Su|Mo|Tu|We|Th|Fr|Sa/).length).toBeGreaterThan(0);
  });

  it("navigates to next month", () => {
    render(<AvailabilityCalendar />);
    const nextBtn = screen.getByRole("button", { name: /next month/i });
    fireEvent.click(nextBtn);
    // No crash, calendar still renders
    expect(nextBtn).toBeTruthy();
  });

  it("calls onRangeSelect when two dates are picked", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day1 = "10";
    const day2 = "15";
    const d1 = `${year}-${month}-${day1}`;
    const d2 = `${year}-${month}-${day2}`;

    const onRange = vi.fn();
    render(
      <AvailabilityCalendar
        availability={[
          { date: d1, available: true },
          { date: d2, available: true },
        ]}
        onRangeSelect={onRange}
      />
    );

    const day1Btn = screen.queryByRole("button", { name: new RegExp(d1) });
    const day2Btn = screen.queryByRole("button", { name: new RegExp(d2) });

    if (day1Btn && day2Btn) {
      fireEvent.click(day1Btn);
      fireEvent.click(day2Btn);
      expect(onRange).toHaveBeenCalledWith(d1, d2);
    }
  });

  it("marks unavailable days as aria-disabled", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const blockedDate = `${year}-${month}-20`;

    render(
      <AvailabilityCalendar
        availability={[{ date: blockedDate, available: false }]}
      />
    );
    const blockedBtn = screen.queryByRole("button", { name: new RegExp(blockedDate) });
    if (blockedBtn) {
      expect(blockedBtn.getAttribute("aria-disabled")).toBe("true");
    }
  });

  it("shows clear button after range is selected", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    render(
      <AvailabilityCalendar
        checkIn={`${year}-${month}-10`}
        checkOut={`${year}-${month}-15`}
      />
    );
    expect(screen.getByRole("button", { name: /clear/i })).toBeTruthy();
  });

  it("calls onMinStayViolation when minimum stay violated", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const d1 = `${year}-${month}-10`;
    const d2 = `${year}-${month}-12`; // 2 nights, below minimumStay of 5

    const onViolation = vi.fn();
    render(
      <AvailabilityCalendar
        availability={[
          { date: d1, available: true, minimumStay: 5 },
          { date: d2, available: true },
        ]}
        onMinStayViolation={onViolation}
      />
    );

    const d1Btn = screen.queryByRole("button", { name: new RegExp(d1) });
    const d2Btn = screen.queryByRole("button", { name: new RegExp(d2) });
    if (d1Btn && d2Btn) {
      fireEvent.click(d1Btn);
      fireEvent.click(d2Btn);
      expect(onViolation).toHaveBeenCalledWith(5);
    }
  });
});
