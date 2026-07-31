import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card, CardHeader, CardContent, CardFooter } from "../../src/primitives/Card";
import { Skeleton } from "../../src/primitives/Skeleton";
import { EmptyState } from "../../src/primitives/EmptyState";
import { renderWithProviders } from "../utils/render";

describe("Card", () => {
  it("renders header, content, and footer", () => {
    renderWithProviders(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("renders with configurable dimensions", () => {
    renderWithProviders(<Skeleton data-testid="skeleton" width={120} height={24} />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveStyle({ width: "120px", height: "24px" });
    expect(skeleton.className).toContain("animate-pulse");
  });
});

describe("EmptyState", () => {
  it("renders title, description, and action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(
      <EmptyState
        icon={<span data-testid="icon">✈</span>}
        title="No trips yet"
        description="Start searching"
        action={{ label: "Search", onClick }}
      />,
    );
    expect(screen.getByText("No trips yet")).toBeInTheDocument();
    expect(screen.getByText("Start searching")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
