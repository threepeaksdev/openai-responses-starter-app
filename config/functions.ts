import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const projectRef = 'khcalqejjhsggismhfmp';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

// Client-side function implementations
export async function get_weather({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) {
  const res = await fetch(
    `/api/functions/get_weather?${new URLSearchParams({ location, unit })}`
  ).then((res) => res.json());
  return res;
}

export async function get_joke() {
  const res = await fetch(`/api/functions/get_joke`).then((res) => res.json());
  return res;
}

export async function get_contacts(params: any = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.search_term) queryParams.set('search_term', params.search_term);
  if (params.tags?.length) queryParams.set('tags', params.tags.join(','));
  if (params.sort_by) queryParams.set('sort_by', params.sort_by);
  if (params.sort_order) queryParams.set('sort_order', params.sort_order);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.per_page) queryParams.set('per_page', params.per_page.toString());

  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/contacts?${queryParams.toString()}`,
    { headers }
  );
  return response.json();
}

export async function create_contact(contact: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/contacts`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(contact),
    }
  );
  return response.json();
}

export async function update_contact({ id, ...updates }: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/contacts?id=${id}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    }
  );
  return response.json();
}

export async function delete_contact({ id }: { id: string }) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/contacts?id=${id}`,
    {
      method: 'DELETE',
      headers,
    }
  );
  return response.json();
}

export async function get_tasks(params: any = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.task_id) queryParams.set('id', params.task_id);
  if (params.status) queryParams.set('status', params.status);
  if (params.priority) queryParams.set('priority', params.priority);
  if (params.tags?.length) queryParams.set('tags', params.tags.join(','));
  if (params.sort_by) queryParams.set('sort_by', params.sort_by);
  if (params.sort_order) queryParams.set('sort_order', params.sort_order);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.per_page) queryParams.set('per_page', params.per_page.toString());

  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/tasks?${queryParams.toString()}`,
    { headers }
  );
  return response.json();
}

export async function create_task(task: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/tasks`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(task),
    }
  );
  return response.json();
}

export async function edit_task({ task_id, ...updates }: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/tasks?id=${task_id}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    }
  );
  return response.json();
}

export async function get_notes(params: any = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.note_id) queryParams.set('id', params.note_id);
  if (params.search_term) queryParams.set('search_term', params.search_term);
  if (params.type) queryParams.set('type', params.type);
  if (params.status) queryParams.set('status', params.status);
  if (params.priority) queryParams.set('priority', params.priority);
  if (params.contact_id) queryParams.set('contact_id', params.contact_id);
  if (params.task_id) queryParams.set('task_id', params.task_id);
  if (params.project_id) queryParams.set('project_id', params.project_id);
  if (params.tags?.length) queryParams.set('tags', params.tags.join(','));
  if (params.sort_by) queryParams.set('sort_by', params.sort_by);
  if (params.sort_order) queryParams.set('sort_order', params.sort_order);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.per_page) queryParams.set('per_page', params.per_page.toString());

  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/notes?${queryParams.toString()}`,
    { headers }
  );
  return response.json();
}

export async function create_note(note: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/notes`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(note),
    }
  );
  return response.json();
}

export async function edit_note({ note_id, ...updates }: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/notes?id=${note_id}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    }
  );
  return response.json();
}

export async function get_projects(params: any = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.project_id) queryParams.set('id', params.project_id);
  if (params.search_term) queryParams.set('search_term', params.search_term);
  if (params.status) queryParams.set('status', params.status);
  if (params.priority) queryParams.set('priority', params.priority);
  if (params.tags?.length) queryParams.set('tags', params.tags.join(','));
  if (params.sort_by) queryParams.set('sort_by', params.sort_by);
  if (params.sort_order) queryParams.set('sort_order', params.sort_order);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.per_page) queryParams.set('per_page', params.per_page.toString());

  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/projects?${queryParams.toString()}`,
    { headers }
  );
  return response.json();
}

export async function create_project(project: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/projects`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(project),
    }
  );
  return response.json();
}

export async function edit_project({ project_id, ...updates }: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/projects?id=${project_id}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    }
  );
  return response.json();
}

export const functions = {
  get_contacts: {
    name: "get_contacts",
    description: "Search and retrieve contacts. Use the search_term parameter to search across contact fields.",
    parameters: {
      type: "object",
      properties: {
        search_term: {
          type: "string",
          description: "Optional search term to filter contacts by name, email, etc."
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of tags to filter contacts by"
        },
        sort_by: {
          type: "string",
          enum: ["first_name", "last_name", "created_at", "updated_at"],
          description: "Field to sort contacts by"
        },
        sort_order: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort order (ascending or descending)"
        },
        page: {
          type: "number",
          description: "Page number for pagination"
        },
        per_page: {
          type: "number",
          description: "Number of contacts per page"
        }
      }
    },
    handler: get_contacts
  },
  create_contact: {
    name: "create_contact",
    description: "Create a new contact",
    parameters: {
      type: "object",
      properties: {
        first_name: {
          type: "string",
          description: "Contact's first name"
        },
        last_name: {
          type: "string",
          description: "Contact's last name"
        },
        email: {
          type: "string",
          description: "Contact's email address"
        },
        phone: {
          type: "string",
          description: "Contact's phone number"
        },
        company: {
          type: "string",
          description: "Contact's company"
        },
        location: {
          type: "string",
          description: "Contact's location"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Array of tags for the contact"
        }
      },
      required: ["first_name", "last_name"]
    },
    handler: create_contact
  },
  update_contact: {
    name: "update_contact",
    description: "Update an existing contact",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Contact ID to update"
        },
        first_name: {
          type: "string",
          description: "Contact's first name"
        },
        last_name: {
          type: "string",
          description: "Contact's last name"
        },
        email: {
          type: "string",
          description: "Contact's email address"
        },
        phone: {
          type: "string",
          description: "Contact's phone number"
        },
        company: {
          type: "string",
          description: "Contact's company"
        },
        location: {
          type: "string",
          description: "Contact's location"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Array of tags for the contact"
        }
      },
      required: ["id"]
    },
    handler: update_contact
  },
  delete_contact: {
    name: "delete_contact",
    description: "Delete a contact",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Contact ID to delete"
        }
      },
      required: ["id"]
    },
    handler: delete_contact
  }
};

// Map function names to their implementations
export const functionsMap = {
  get_weather,
  get_joke,
  get_contacts,
  create_contact,
  update_contact,
  delete_contact,
  get_tasks,
  create_task,
  edit_task,
  get_notes,
  create_note,
  edit_note,
  get_projects,
  create_project,
  edit_project,
};
