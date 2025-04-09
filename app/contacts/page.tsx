"use client";

import { useState } from "react";
import { Search, Plus, Filter, Edit2, X } from "lucide-react";
import { Contact } from "@/app/api/types";
import { useDataFetch } from "@/lib/hooks/use-data-fetch";
import { createClient } from "@/lib/supabase/client";

// Update Contact type to include relationship_status
interface ContactWithStatus extends Contact {
  relationship_status?: string;
}

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'created_at' | 'updated_at'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithStatus | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: contacts, loading, error, mutate } = useDataFetch<ContactWithStatus>({
    endpoint: 'functions/contacts',
    searchTerm,
    tags: selectedTags,
    sortBy,
    sortOrder
  });

  const handleUpdateContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        location: formData.get('location'),
        relationship_status: formData.get('relationship_status'),
      };

      console.log('Starting contact update:', {
        contactId: editingContact.id,
        updates
      });

      const response = await fetch(`/api/contacts?id=${editingContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || `HTTP error! status: ${response.status}`;
        console.error('Update failed:', errorMessage, responseData);
        throw new Error(errorMessage);
      }

      console.log('Update successful:', responseData);

      // Refresh the contacts list
      mutate();
      setIsEditModalOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Error updating contact:', error);
      alert(error instanceof Error ? error.message : 'Failed to update contact. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2">
            <Plus size={20} />
            Add Contact
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search contacts..."
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="first_name">First Name</option>
                  <option value="last_name">Last Name</option>
                  <option value="created_at">Date Created</option>
                  <option value="updated_at">Last Updated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No contacts found. Add your first contact to get started.
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {contact.first_name} {contact.last_name}
                        <button
                          onClick={() => {
                            setEditingContact(contact);
                            setIsEditModalOpen(true);
                          }}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                      <td className="py-3 px-4">{contact.email || '-'}</td>
                      <td className="py-3 px-4">{contact.phone || '-'}</td>
                      <td className="py-3 px-4">{contact.company || '-'}</td>
                      <td className="py-3 px-4">{contact.location || '-'}</td>
                      <td className="py-3 px-4">
                        {contact.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block bg-gray-100 text-gray-700 rounded-full px-2 py-1 text-xs mr-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Contact Modal */}
      {isEditModalOpen && editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Contact</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingContact(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  defaultValue={editingContact.first_name}
                  required
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  defaultValue={editingContact.last_name}
                  required
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingContact.email || ''}
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingContact.phone || ''}
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  defaultValue={editingContact.company || ''}
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={editingContact.location || ''}
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship Status
                </label>
                <select
                  name="relationship_status"
                  defaultValue={editingContact.relationship_status || ''}
                  className="w-full border border-gray-200 rounded-lg p-2"
                >
                  <option value="">Select status</option>
                  <option value="friend">Friend</option>
                  <option value="family">Family</option>
                  <option value="colleague">Colleague</option>
                  <option value="acquaintance">Acquaintance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingContact(null);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 