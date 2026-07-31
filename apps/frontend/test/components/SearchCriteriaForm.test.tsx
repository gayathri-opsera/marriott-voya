import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchCriteriaForm } from "../../components/search/SearchCriteriaForm";

describe("SearchCriteriaForm", () => {
  it("renders all required fields with labels", () => {
    render(<SearchCriteriaForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/Destination/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Travel type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Departure date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passengers/)).toBeInTheDocument();
  });

  it("shows validation error for short destination on hotel search", async () => {
    const user = userEvent.setup();
    render(<SearchCriteriaForm onSubmit={vi.fn()} initialValues={{ type: "hotels" }} />);

    await user.type(screen.getByLabelText(/Destination/), "A");
    await user.type(screen.getByLabelText(/Departure date/), "2099-06-15");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByText("Destination must be at least 2 characters")).toBeInTheDocument();
  });

  it("calls onSubmit with valid criteria", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SearchCriteriaForm onSubmit={onSubmit} initialValues={{ type: "hotels" }} />);

    await user.type(screen.getByLabelText(/Destination/), "Paris");
    await user.type(screen.getByLabelText(/Departure date/), "2099-06-15");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "Paris",
        type: "hotels",
        departureDate: "2099-06-15",
        passengers: 1,
      }),
    );
  });
});
