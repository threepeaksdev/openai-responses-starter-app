"use client";
import Assistant from "@/components/assistant";
import ToolsPanel from "@/components/tools-panel";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Main() {
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <Assistant />
        </div>
        <div className="hidden lg:block w-full lg:w-[350px] overflow-y-auto">
          <div className="sticky top-6">
            <ToolsPanel />
          </div>
        </div>
      </div>

      {/* Mobile tools button */}
      <button 
        onClick={() => setIsToolsPanelOpen(true)}
        className="fixed bottom-4 right-4 lg:hidden z-40 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800"
      >
        <Menu size={24} />
      </button>

      {/* Mobile tools panel */}
      {isToolsPanelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsToolsPanelOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[80%] max-w-[350px] bg-white shadow-xl">
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
