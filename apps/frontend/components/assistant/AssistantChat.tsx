"use client";

import * as React from "react";
import type { Message, TripDraftItem } from "../../lib/assistant-stream";
import { MessageStream } from "./MessageStream";
import { ToolActivityIndicator } from "./ToolActivityIndicator";
import { TripDraftPanel } from "./TripDraftPanel";
import { StreamErrorBanner, type StreamErrorKind } from "./StreamErrorBanner";
import { Composer } from "./Composer";

export interface AssistantChatProps {
  messages: Message[];
  isStreaming: boolean;
  activeTool?: string | null;
  tripDraft?: TripDraftItem[] | null;
  budgetCommitted?: number;
  budgetTotal?: number;
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
  tripDraft,
  budgetCommitted,
  budgetTotal,
  errorKind,
  errorMessage,
  onRetry,
  retryCount,
  onSend,
  onStop,
}: AssistantChatProps): React.JSX.Element {
  const [composerPrefill, setComposerPrefill] = React.useState<string | undefined>();

  const handleChipClick = React.useCallback((chip: string) => {
    setComposerPrefill(chip);
    // Clear after a tick so it can be re-used
    setTimeout(() => setComposerPrefill(undefined), 100);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Messages */}
      <MessageStream
        messages={messages}
        isStreaming={isStreaming && !activeTool}
        onSend={handleChipClick}
      />

      {/* Active tool spinner */}
      {activeTool && (
        <div className="px-4 pb-2">
          <ToolActivityIndicator toolName={activeTool} isActive={isStreaming} />
        </div>
      )}

      {/* Error banner */}
      {errorKind && (
        <div className="px-4 pb-2">
          <StreamErrorBanner
            errorKind={errorKind}
            message={errorMessage ?? undefined}
            onRetry={onRetry}
            retryCount={retryCount}
          />
        </div>
      )}

      {/* Live trip draft panel */}
      {tripDraft && tripDraft.length > 0 && (
        <TripDraftPanel
          items={tripDraft}
          budgetCommitted={budgetCommitted}
          budgetTotal={budgetTotal}
        />
      )}

      {/* Composer */}
      <Composer
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        prefill={composerPrefill}
      />
    </div>
  );
}
