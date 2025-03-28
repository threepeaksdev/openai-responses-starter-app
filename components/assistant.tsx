"use client";
import React, { useEffect, useState } from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth";
import { useMessages } from "@/lib/hooks/useMessages";
import useConversationsStore from "@/stores/useConversationsStore";
import { useRouter } from "next/navigation";

export default function Assistant() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { currentConversationId, createNewConversation } = useConversationsStore();
  const { chatMessages, addConversationItem, addChatMessage } = useConversationStore();
  const { messages, loading: messagesLoading, addMessage, fetchMessages } = useMessages(
    currentConversationId || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (!currentConversationId) {
      createNewConversation();
    }
  }, [authLoading, user, currentConversationId, createNewConversation, router]);

  useEffect(() => {
    if (currentConversationId) {
      fetchMessages();
    }
  }, [currentConversationId, fetchMessages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentConversationId || isProcessing) return;

    const userItem: Item = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: message.trim() }],
    };
    const userMessage: any = {
      role: "user",
      content: message.trim(),
    };

    try {
      setIsProcessing(true);

      // Add message to local state and Supabase simultaneously
      addConversationItem(userMessage);
      addChatMessage(userItem);
      const addMessagePromise = addMessage(message.trim(), 'user');

      // Process the message with the AI while the message is being added to Supabase
      await Promise.all([addMessagePromise, processMessages()]);

      // After AI responds, add the response to Supabase
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage && lastMessage.type === 'message' && lastMessage.role === 'assistant') {
        const assistantContent = lastMessage.content[0].text;
        if (assistantContent) {
          await addMessage(assistantContent, 'assistant');
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Only show loading on initial auth check
  if (authLoading) {
    return <div className="h-full p-4 w-full bg-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-full p-4 w-full bg-white">
      <Chat 
        items={chatMessages} 
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing} 
      />
    </div>
  );
}
