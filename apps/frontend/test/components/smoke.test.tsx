import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../utils/render";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import * as React from "react";

function ToastTrigger() {
  const { addToast } = useToast();
  React.useEffect(() => {
    addToast({ title: "Test toast", variant: "success" });
  }, [addToast]);
  return null;
}

describe("component smoke tests", () => {
  it("renders Button", () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders Card", () => {
    renderWithProviders(
      <Card>
        <CardTitle>Card title</CardTitle>
        <CardContent>Card body</CardContent>
      </Card>,
    );
    expect(screen.getByText("Card title")).toBeInTheDocument();
    expect(screen.getByText("Card body")).toBeInTheDocument();
  });

  it("renders Toast via ToastProvider", () => {
    renderWithProviders(<ToastTrigger />);
    expect(screen.getByText("Test toast")).toBeInTheDocument();
  });
});
