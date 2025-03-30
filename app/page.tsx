"use client";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Main() {
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">
      <div className="flex-1 max-w-full md:max-w-[70%] h-full">
        <Assistant />
      </div>
      <div className="hidden md:block w-full md:w-[30%] border-l border-gray-200">
        <ToolsPanel />
      </div>
      {/* Mobile menu button */}
      <button 
        onClick={() => setIsToolsPanelOpen(true)}
        className="fixed bottom-4 right-4 md:hidden z-40 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800"
      >
        <Menu size={24} />
      </button>
      {/* Mobile tools panel */}
      {isToolsPanelOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsToolsPanelOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[80%] bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold">Tools</h2>
              <button onClick={() => setIsToolsPanelOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              <ToolsPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
