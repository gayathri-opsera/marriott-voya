import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageStream } from "../../components/assistant/MessageStream";
import type { Message } from "../../lib/assistant-stream";

const messages: Message[] = [
  { role: "user", content: "Find me a flight to Paris" },
  { role: "assistant", content: "I found several options for you." },
];

describe("MessageStream", () => {
  it("renders messages with role labels", () => {
    render(<MessageStream messages={messages} isStreaming={false} />);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();
    expect(screen.getByText("Find me a flight to Paris")).toBeInTheDocument();
    expect(screen.getByText("I found several options for you.")).toBeInTheDocument();
  });

  it("shows streaming indicator when isStreaming is true", () => {
    render(<MessageStream messages={messages} isStreaming={true} />);
    expect(screen.getByTestId("streaming-indicator")).toBeInTheDocument();
    expect(screen.getByLabelText("Assistant is responding")).toBeInTheDocument();
  });

  it("includes an aria-live region for announcements", () => {
    const { container } = render(<MessageStream messages={messages} isStreaming={false} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});
