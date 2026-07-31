import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickSearchForm } from "../../components/landing/QuickSearchForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("QuickSearchForm", () => {
  beforeEach(() => {
    push.mockReset();
    sessionStorage.clear();
  });

  it("renders all form fields with labels", () => {
    render(<QuickSearchForm />);
    expect(screen.getByLabelText(/Destination/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/)).toBeInTheDocument();
    expect(screen.getByLabelText("Search type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("navigates to search route with query params on submit", async () => {
    const user = userEvent.setup();
    render(<QuickSearchForm />);

    await user.type(screen.getByLabelText(/Destination/), "Paris");
    await user.selectOptions(screen.getByLabelText("Search type"), "hotels");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith("/search?q=Paris&type=hotels");
  });

  it("persists entry criteria to sessionStorage before navigating", async () => {
    const user = userEvent.setup();
    render(<QuickSearchForm />);

    await user.type(screen.getByLabelText(/Destination/), "JFK");
    await user.type(screen.getByLabelText("Date"), "2026-12-01");
    await user.click(screen.getByRole("button", { name: "Search" }));

    const stored = JSON.parse(sessionStorage.getItem("voya:entry-criteria") ?? "{}");
    expect(stored).toEqual({
      destination: "JFK",
      type: "flights",
      date: "2026-12-01",
    });
  });
});
