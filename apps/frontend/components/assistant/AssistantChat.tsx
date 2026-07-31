"use client";

import * as React from "react";
import type { UnifiedOffer } from "@travel/contracts/search";
import type { Message } from "../../lib/assistant-stream";
import { MessageStream } from "./MessageStream";
import { ToolActivityIndicator } from "./ToolActivityIndicator";
import { InlineOfferCard } from "./InlineOfferCard";
import { StreamErrorBanner, type StreamErrorKind } from "./StreamErrorBanner";
import { Composer } from "./Composer";

export interface AssistantChatProps {
  messages: Message[];
  isStreaming: boolean;
  activeTool?: string | null;
  toolResults?: UnifiedOffer[];
  errorKind?: StreamErrorKind | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  retryCount?: number;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function AssistantChat({
  messages,
  isStreaming,
  activeTool,
  toolResults = [],
  errorKind,
  errorMessage,
  onRetry,
  retryCount,
  onSend,
  onStop,
}: AssistantChatProps): React.JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageStream messages={messages} isStreaming={isStreaming && !activeTool} />

      {activeTool && (
        <ToolActivityIndicator toolName={activeTool} isActive={isStreaming} />
      )}

      {toolResults.map((offer) => (
        <div key={offer.id} className="px-4 pb-2">
          <InlineOfferCard offer={offer} />
        </div>
      ))}

      {errorKind && (
        <StreamErrorBanner
          errorKind={errorKind}
          message={errorMessage ?? undefined}
          onRetry={onRetry}
          retryCount={retryCount}
        />
      )}

      <Composer onSend={onSend} onStop={onStop} isStreaming={isStreaming} />
    </div>
  );
}
