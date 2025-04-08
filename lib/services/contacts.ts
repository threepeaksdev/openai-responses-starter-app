import { Contact } from '@/app/api/types';

export interface GetContactsOptions {
  searchTerm?: string;
  tags?: string[];
  sortBy?: 'first_name' | 'last_name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

export async function getContacts(options: GetContactsOptions = {}) {
  const params = new URLSearchParams();
  if (options.searchTerm) params.set('search_term', options.searchTerm);
  if (options.tags?.length) params.set('tags', options.tags.join(','));
  if (options.sortBy) params.set('sort_by', options.sortBy);
  if (options.sortOrder) params.set('sort_order', options.sortOrder);
  if (options.page) params.set('page', options.page.toString());
  if (options.perPage) params.set('per_page', options.perPage.toString());

  const response = await fetch(`/api/contacts?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch contacts');
  }
  return response.json();
}

export async function createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
  const response = await fetch('/api/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contact),
  });

  if (!response.ok) {
    throw new Error('Failed to create contact');
  }
  return response.json();
}

export async function updateContact(id: string, updates: Partial<Contact>) {
  const response = await fetch('/api/contacts', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...updates }),
  });

  if (!response.ok) {
    throw new Error('Failed to update contact');
  }
  return response.json();
}

export async function deleteContact(id: string) {
  const response = await fetch(`/api/contacts?id=${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete contact');
  }
  return response.json();
} 