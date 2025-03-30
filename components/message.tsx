import { MessageItem } from "@/lib/assistant";
import React from "react";
import ReactMarkdown from "react-markdown";

interface MessageProps {
  message: MessageItem;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  return (
    <div className="text-sm md:text-base">
      {message.role === "user" ? (
        <div className="flex justify-end">
          <div className="max-w-[85%] md:max-w-[75%]">
            <div className="rounded-2xl px-4 py-2.5 bg-[#e3f2fd] text-black shadow-sm">
              <ReactMarkdown className="prose prose-sm max-w-none">
                {message.content[0].text as string}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex">
          <div className="max-w-[85%] md:max-w-[75%]">
            <div className="rounded-2xl px-4 py-2.5 bg-[#f8f9fa] text-black shadow-sm">
              <ReactMarkdown className="prose prose-sm max-w-none">
                {message.content[0].text as string}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
