import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "../../components/assistant/Composer";

describe("Composer", () => {
  it("renders a textarea with aria-label Message", () => {
    render(<Composer onSend={vi.fn()} onStop={vi.fn()} isStreaming={false} />);
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });

  it("calls onSend when form is submitted", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<Composer onSend={onSend} onStop={vi.fn()} isStreaming={false} />);

    await user.type(screen.getByLabelText("Message"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  it("shows Stop button when streaming and calls onStop", async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(<Composer onSend={vi.fn()} onStop={onStop} isStreaming={true} />);

    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalled();
  });
});
