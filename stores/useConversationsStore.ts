import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

interface ConversationsState {
  currentConversationId: string | null
  setCurrentConversationId: (id: string) => void
  createNewConversation: () => string
}

const useConversationsStore = create<ConversationsState>((set) => ({
  currentConversationId: null,
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  createNewConversation: () => {
    const newId = uuidv4()
    set({ currentConversationId: newId })
    return newId
  },
}))

export default useConversationsStore 