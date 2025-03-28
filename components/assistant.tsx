"use client";
import React, { useEffect, useState } from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { processMessages } from "@/lib/assistant";
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth";
import { useMessages } from "@/lib/hooks/useMessages";
import useConversationsStore from "@/stores/useConversationsStore";
import { useRouter } from "next/navigation";

export default function Assistant() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { currentConversationId, createNewConversation } = useConversationsStore();
  const { chatMessages, addConversationItem } = useConversationStore();
  const { addMessage, fetchMessages } = useMessages(currentConversationId || '');
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

    try {
      setIsProcessing(true);

      // Add message to local state and Supabase simultaneously
      const userMessage = {
        role: "user" as const,
        content: message.trim(),
      };
      
      addConversationItem(userMessage);
      await addMessage(message.trim(), 'user');
      await processMessages();

      // After AI responds, add the response to Supabase
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage && 'content' in lastMessage && typeof lastMessage.content === 'string') {
        await addMessage(lastMessage.content, 'assistant');
      }
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

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
