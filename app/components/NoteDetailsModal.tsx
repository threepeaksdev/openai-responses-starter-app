import { useState } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { Database } from '@/types/supabase';

type Note = Database['public']['Tables']['notes']['Row'];

interface NoteDetailsModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export default function NoteDetailsModal({
  note,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: NoteDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(note);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!isOpen) return null;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedNote(note);
  };

  const handleSave = () => {
    onEdit(editedNote);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(note.id!);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            {isEditing ? (
              <input
                type="text"
                value={editedNote.title}
                onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
                className="text-2xl font-semibold w-full border-b border-gray-200 focus:outline-none focus:border-black pb-1"
              />
            ) : (
              <h2 className="text-2xl font-semibold">{note.title}</h2>
            )}
            
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-100"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-block rounded-full px-3 py-1 text-sm ${
              note.type === 'contact' ? 'bg-blue-100 text-blue-800' :
              note.type === 'task' ? 'bg-purple-100 text-purple-800' :
              note.type === 'project' ? 'bg-indigo-100 text-indigo-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
            </span>
            <span className={`inline-block rounded-full px-3 py-1 text-sm ${
              note.priority === 'high' ? 'bg-red-100 text-red-800' :
              note.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
            </span>
            <span className={`inline-block rounded-full px-3 py-1 text-sm ${
              note.status === 'active' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
            </span>
          </div>

          {isEditing ? (
            <textarea
              value={editedNote.content || ''}
              onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
              className="w-full h-48 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
            />
          ) : (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{note.content}</p>
            </div>
          )}

          {note.tags && note.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
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

          <div className="mt-4 text-sm text-gray-500">
            <p>Created: {new Date(note.created_at).toLocaleString()}</p>
            <p>Last updated: {new Date(note.updated_at).toLocaleString()}</p>
          </div>
        </div>

        {isDeleteConfirmOpen && (
          <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center">
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Delete Note</h3>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this note? This action cannot be undone.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 