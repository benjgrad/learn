"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StreamingText } from "./StreamingText";
import { SignInPromptDialog } from "./SignInPromptDialog";
import { useAIRequest } from "@/lib/use-ai-request";
import { RateLimitError } from "@/lib/ai-client";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ModuleChat({
  moduleTitle,
  levelTitle,
}: {
  moduleTitle: string;
  levelTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    requestAI,
    showSignInPrompt,
    rateLimitHit,
    remaining,
    limit,
    continueAsAnonymous,
    dismissSignInPrompt,
  } = useAIRequest();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      let fullResponse = "";
      await requestAI(
        "/api/module-chat",
        {
          moduleTitle,
          levelTitle,
          messages: newMessages,
        },
        (text) => {
          fullResponse += text;
          setStreamingContent(fullResponse);
        },
        () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullResponse },
          ]);
          setStreamingContent("");
          setIsStreaming(false);
        }
      );
    } catch (err) {
      const errorMessage =
        err instanceof RateLimitError
          ? "You've reached your daily AI usage limit. Sign in for more uses, or try again tomorrow."
          : "Unable to connect right now. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage },
      ]);
      setStreamingContent("");
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, moduleTitle, levelTitle, requestAI]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 right-0 z-40 w-full h-[75vh] sm:bottom-6 sm:right-6 sm:w-96 sm:h-[28rem] bg-background border sm:rounded-xl rounded-t-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Ask about this module</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setMessages([]);
                setOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !isStreaming && (
            <p className="text-sm text-muted-foreground text-center mt-8">
              Ask any question about this module.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === "user"
                  ? "ml-8 bg-primary text-primary-foreground rounded-xl rounded-br-md p-3"
                  : "mr-8 bg-muted rounded-xl rounded-bl-md p-3"
              }`}
            >
              {msg.role === "assistant" ? (
                <StreamingText content={msg.content} isStreaming={false} />
              ) : (
                msg.content
              )}
            </div>
          ))}
          {isStreaming && streamingContent && (
            <div className="mr-8 bg-muted rounded-xl rounded-bl-md p-3 text-sm">
              <StreamingText content={streamingContent} isStreaming={true} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t">
          {rateLimitHit && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-2">
              Daily AI usage limit reached. Sign in for more uses.
            </p>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[36px] max-h-[80px] text-sm resize-none"
              disabled={isStreaming || rateLimitHit}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || rateLimitHit}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <SignInPromptDialog
        open={showSignInPrompt}
        remaining={remaining}
        limit={limit}
        onContinue={continueAsAnonymous}
        onClose={dismissSignInPrompt}
      />
    </>
  );
}
