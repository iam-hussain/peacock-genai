"use client";

import { Mic, MicOff } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  /** Optional ref to the textarea for focus management */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  onSend,
  disabled,
  inputRef: externalRef,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = internalRef;
  const setTextareaRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      (
        internalRef as React.MutableRefObject<HTMLTextAreaElement | null>
      ).current = el;
      if (externalRef) {
        (
          externalRef as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = el;
      }
    },
    [externalRef]
  );

  const handleSpeechResult = useCallback(
    (finalTranscript: string, interimTranscript: string) => {
      if (finalTranscript) {
        setInput((prev) =>
          prev ? `${prev} ${finalTranscript}` : finalTranscript
        );
      }
      setInterimTranscript(interimTranscript);
    },
    []
  );

  const { isListening, isSupported, toggle } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: () => {},
    lang: "en-IN",
    continuous: true,
    interimResults: true,
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- textareaRef is stable, we only need to resize when content changes
  }, [input, interimTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toSend = displayValue.trim();
    if (toSend && !disabled) {
      onSend(toSend);
      setInput("");
      setInterimTranscript("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const displayValue =
    input + (interimTranscript ? ` ${interimTranscript}` : "");

  return (
    <div className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 md:px-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row sm:gap-2"
        >
          <div className="relative flex flex-1 min-w-0">
            <textarea
              ref={setTextareaRef}
              value={displayValue}
              onChange={(e) => {
                setInput(e.target.value);
                setInterimTranscript("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isSupported
                  ? "Type or use the mic to speak... (Enter to send)"
                  : "Type your message... (Enter to send)"
              }
              disabled={disabled}
              rows={1}
              className={cn(
                "flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm min-h-[44px]",
                "ring-offset-background placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "max-h-32 overflow-y-auto"
              )}
            />
            {isSupported && (
              <button
                type="button"
                onClick={toggle}
                disabled={disabled}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isListening
                    ? "bg-destructive/20 text-destructive"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-label={
                  isListening ? "Stop listening" : "Start voice input"
                }
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!displayValue.trim() || disabled}
            className={cn(
              "rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground min-h-[44px]",
              "transition-colors hover:bg-primary/90 active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
