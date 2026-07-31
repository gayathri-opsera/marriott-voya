import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterPanel, type Filters } from "../../components/search/FilterPanel";

const defaultFilters: Filters = {
  sort: "price_asc",
  density: "comfortable",
};

describe("FilterPanel", () => {
  it("renders price range, sort, and density controls", () => {
    render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
    expect(screen.getByLabelText("Min price")).toBeInTheDocument();
    expect(screen.getByLabelText("Max price")).toBeInTheDocument();
    expect(screen.getByText("Sort by")).toBeInTheDocument();
    expect(screen.getByText("Result density")).toBeInTheDocument();
  });

  it("calls onFilterChange when sort option changes", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterPanel filters={defaultFilters} onFilterChange={onFilterChange} />);

    await user.click(screen.getByLabelText("Price: High to Low"));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "price_desc" }),
    );
  });

  it("calls onFilterChange when min price is updated", () => {
    const onFilterChange = vi.fn();
    render(<FilterPanel filters={defaultFilters} onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByLabelText(/Min price/), { target: { value: "100" } });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 100 }),
    );
  });
});
