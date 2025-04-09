"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ToolCall from "./tool-call";
import Message from "./message";
import Annotations from "./annotations";
import { Item } from "@/lib/assistant";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
}

const Chat: React.FC<ChatProps> = ({ items, onSendMessage, isProcessing = false }) => {
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  const [isComposing, setIsComposing] = useState(false);

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !isComposing &&
        !isProcessing
      ) {
        event.preventDefault();
        onSendMessage(inputMessageText);
        setinputMessageText("");
      }
    },
    [onSendMessage, inputMessageText, isProcessing, isComposing]
  );

  useEffect(() => {
    scrollToBottom();
  }, [items]);

  return (
    // 1) Make this container flex with full height
    <div className="flex flex-col h-full">
      {/* 2) Put messages in a flex-1 scroll area */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="max-w-3xl mx-auto px-4 pt-4 space-y-6">
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.type === "tool_call" ? (
                <ToolCall toolCall={item} />
              ) : item.type === "message" ? (
                <div className="flex flex-col gap-1.5">
                  <Message message={item} />
                  {item.content &&
                    item.content[0].annotations &&
                    item.content[0].annotations.length > 0 && (
                      <Annotations
                        annotations={item.content[0].annotations}
                      />
                    )}
                </div>
              ) : null}
            </React.Fragment>
          ))}
          <div ref={itemsEndRef} />
        </div>
      </div>

      {/* 3) Input pinned at bottom by flex layout (no sticky needed) */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="relative">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-colors">
              <div className="flex items-end p-2">
                <textarea
                  id="prompt-textarea"
                  tabIndex={0}
                  rows={1}
                  placeholder={isProcessing ? "Processing..." : "Message..."}
                  className="min-h-[24px] w-full resize-none bg-transparent px-3 py-2 text-base focus:outline-none disabled:opacity-60"
                  value={inputMessageText}
                  onChange={(e) => {
                    setinputMessageText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  disabled={isProcessing}
                  style={{
                    height: "auto",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                />
                <div className="flex items-center gap-2 pl-2">
                  <button
                    disabled={!inputMessageText || isProcessing}
                    data-testid="send-button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white transition-all hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    onClick={() => {
                      onSendMessage(inputMessageText);
                      setinputMessageText("");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="h-4 w-4 rotate-90"
                      strokeWidth="2"
                    >
                      <path
                        d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
};

export default Chat;
