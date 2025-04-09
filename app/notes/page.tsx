"use client";

import { useState } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { Database } from "@/types/supabase";
import { useDataFetch } from "@/lib/hooks/use-data-fetch";
import NoteDetailsModal from "../components/NoteDetailsModal";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { edit_note, delete_note } from '@/config/functions';

type Note = Database['public']['Tables']['notes']['Row'];

function formatContent(content: string | null, maxLength: number = 150): string {
  if (!content) return '';
  return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
}

export default function NotesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<Note['type']>();
  const [selectedStatus, setSelectedStatus] = useState<Note['status']>();
  const [selectedPriority, setSelectedPriority] = useState<Note['priority']>();
  const [selectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'updated_at' | 'priority'>('updated_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { data: notes, loading, error, mutate } = useDataFetch<Note>({
    endpoint: 'functions/notes',
    searchTerm,
    type: selectedType,
    status: selectedStatus,
    priority: selectedPriority,
    tags: selectedTags,
    sortBy,
    sortOrder
  });

  const handleEditNote = async (updatedNote: Note) => {
    try {
      console.log('Updating note with data:', updatedNote);
      
      // Only include fields that are in the database schema
      const { id, title, content, type, status, priority, tags } = updatedNote;
      const noteData = { note_id: id, title, content, type, status, priority, tags };
      
      console.log('Cleaned note data:', noteData);

      const result = await edit_note(noteData);
      console.log('Note updated successfully:', result);

      // Refresh the notes list
      mutate();
      setSelectedNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const result = await delete_note(noteId);
      console.log('Note deleted successfully:', result);

      // Refresh the notes list
      mutate();
      setSelectedNote(null);
    } catch (error) {
      console.error('Error deleting note:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Notes</h1>
          <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2">
            <Plus size={20} />
            New Note
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {isFiltersOpen && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={selectedType || ''}
                  onChange={(e) => setSelectedType(e.target.value as Note['type'] || undefined)}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="">All</option>
                  <option value="general">General</option>
                  <option value="contact">Contact</option>
                  <option value="task">Task</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e.target.value as Note['status'] || undefined)}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={selectedPriority || ''}
                  onChange={(e) => setSelectedPriority(e.target.value as Note['priority'] || undefined)}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="title">Title</option>
                  <option value="updated_at">Last Updated</option>
                  <option value="created_at">Date Created</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading...
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-8 text-red-500">
              {error}
            </div>
          ) : notes?.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No notes found. Create your first note to get started.
            </div>
          ) : (
            notes?.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedNote(note)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{note.title}</h3>
                    <div className="flex gap-2">
                      <span className={`shrink-0 inline-block rounded-full px-2 py-1 text-xs ${
                        note.type === 'contact' ? 'bg-blue-100 text-blue-800' :
                        note.type === 'task' ? 'bg-purple-100 text-purple-800' :
                        note.type === 'project' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                      </span>
                      <span className={`shrink-0 inline-block rounded-full px-2 py-1 text-xs ${
                        note.priority === 'high' ? 'bg-red-100 text-red-800' :
                        note.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {formatContent(note.content)}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                      note.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                    </span>
                    <span>
                      Last updated: {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-gray-100 text-gray-700 rounded-full px-2 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedNote && (
        <NoteDetailsModal
          note={selectedNote}
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
        />
      )}
    </div>
  );
} 