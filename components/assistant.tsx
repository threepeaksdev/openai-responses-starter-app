"use client";
import React, { useEffect, useState } from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { processMessages } from "@/lib/assistant";
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth";
import { useMessages } from "@/lib/hooks/useMessages";
import { useNotes } from "@/lib/hooks/useNotes";
import useConversationsStore from "@/stores/useConversationsStore";
import { useRouter } from "next/navigation";
import { Item } from "@/lib/assistant";

export default function Assistant() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { currentConversationId, createNewConversation } = useConversationsStore();
  const { chatMessages, addConversationItem, addChatMessage } = useConversationStore();
  const { addMessage, fetchMessages } = useMessages(currentConversationId || '');
  const { getHighPriorityNotes } = useNotes();
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter out system messages for UI display
  const visibleMessages = chatMessages.filter((item: Item) => 
    item.type !== "message" || item.role !== "system"
  );

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
    const loadConversationData = async () => {
      if (currentConversationId) {
        await fetchMessages();
        
        // Load high priority notes
        const highPriorityNotes = await getHighPriorityNotes();
        if (highPriorityNotes.length > 0) {
          // Add high priority notes as system message
          const notesContent = highPriorityNotes.map(note => 
            `[High Priority Note] ${note.title}\n${note.content}`
          ).join('\n\n');
          
          const systemMessage = {
            type: "message" as const,
            role: "system" as const,
            content: [{
              type: "input_text" as const,
              text: `Here are the user's current high priority notes for context:\n\n${notesContent}`
            }]
          };
          
          // Add to conversation store but don't display in UI
          addChatMessage(systemMessage);
          addConversationItem({
            role: "system",
            content: systemMessage.content[0].text
          });
        }
      }
    };

    loadConversationData();
  }, [currentConversationId, fetchMessages, getHighPriorityNotes, addChatMessage, addConversationItem]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentConversationId || isProcessing) return;

    try {
      setIsProcessing(true);

      // Create message for chat display
      const chatMessage = {
        type: "message" as const,
        role: "user" as const,
        content: [{
          type: "input_text" as const,
          text: message.trim()
        }]
      };

      // Create message for conversation store
      const conversationMessage = {
        role: "user" as const,
        content: message.trim()
      };
      
      addChatMessage(chatMessage);
      addConversationItem(conversationMessage);
      await addMessage(message.trim(), 'user');
      await processMessages();

      // After AI responds, add the response to Supabase
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage?.type === 'message' && lastMessage.content?.[0]?.text) {
        await addMessage(lastMessage.content[0].text, 'assistant');
      }
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <Chat 
        items={visibleMessages} 
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing} 
      />
    </div>
  );
}
