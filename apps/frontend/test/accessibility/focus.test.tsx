/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { MessageStream } from "../../components/assistant/MessageStream";
import { ToastProvider, useToast } from "../../components/ui/Toast";
import { Modal, Button } from "@travel/design-system";

function ToastTrigger(): React.JSX.Element {
  const { addToast } = useToast();
  return (
    <button type="button" onClick={() => addToast({ title: "Error occurred", variant: "error" })}>
      Show error
    </button>
  );
}

function ModalTest(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onOpenChange={setOpen} title="Test modal">
        <Button onClick={() => setOpen(false)}>Close modal</Button>
      </Modal>
    </>
  );
}

describe("keyboard and live-region conformance", () => {
  it("MessageStream has aria-live polite region", () => {
    render(
      <MessageStream
        messages={[{ role: "assistant", content: "Hello traveler" }]}
        isStreaming={false}
      />,
    );
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-atomic", "false");
  });

  it("Toast uses role=alert for error variant", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Show error" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Error occurred");
    });
  });

  it("Modal opens and closes via trigger", async () => {
    const user = userEvent.setup();
    render(<ModalTest />);
    const trigger = screen.getByRole("button", { name: "Open modal" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close modal" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
