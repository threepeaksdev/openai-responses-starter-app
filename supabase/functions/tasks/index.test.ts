import { createClient } from '@supabase/supabase-js';
import { handleRequest } from './index';

// Mock Supabase client
jest.mock('@supabase/supabase-js');

describe('Tasks Function', () => {
  const mockUser = { id: 'test-user-id' };
  const mockTask = {
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'medium',
    user_id: mockUser.id,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Supabase client methods
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis()
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('GET request', () => {
    it('should return all tasks for authenticated user', async () => {
      const mockTasks = [mockTask];
      mockSupabaseClient.select.mockResolvedValue({ data: mockTasks, error: null, count: 1 });

      const request = new Request('http://localhost/tasks?page=1&per_page=10', {
        method: 'GET',
        headers: { 'authorization': 'Bearer test-token' }
      });

      const response = await handleRequest(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual({
        data: mockTasks,
        total: 1,
        page: 1,
        per_page: 10
      });
    });

    it('should handle search and filter parameters', async () => {
      const request = new Request(
        'http://localhost/tasks?search_term=test&status=pending&priority=high&tags=important,urgent',
        { method: 'GET', headers: { 'authorization': 'Bearer test-token' } }
      );

      await handleRequest(request);

      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        'title.ilike.%test%,description.ilike.%test%'
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'pending');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('priority', 'high');
      expect(mockSupabaseClient.contains).toHaveBeenCalledWith('tags', ['important', 'urgent']);
    });
  });

  describe('POST request', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description'
      };
      mockSupabaseClient.single.mockResolvedValue({ data: { ...newTask, id: 'new-task-id' }, error: null });

      const request = new Request('http://localhost/tasks', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(newTask)
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result).toHaveProperty('id', 'new-task-id');
    });

    it('should return 400 if title is missing', async () => {
      const request = new Request('http://localhost/tasks', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ description: 'No Title' })
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error', 'Title is required');
    });
  });

  describe('PUT request', () => {
    it('should update an existing task', async () => {
      const updates = { title: 'Updated Title' };
      mockSupabaseClient.single.mockResolvedValue({ data: { ...mockTask, ...updates }, error: null });

      const request = new Request('http://localhost/tasks?id=test-task-id', {
        method: 'PUT',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('title', 'Updated Title');
    });

    it('should return 400 if task ID is missing', async () => {
      const request = new Request('http://localhost/tasks', {
        method: 'PUT',
        headers: {
          'authorization': 'Bearer test-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ title: 'Updated Title' })
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error', 'Task ID is required');
    });
  });

  describe('DELETE request', () => {
    it('should delete a task', async () => {
      mockSupabaseClient.delete.mockResolvedValue({ error: null });

      const request = new Request('http://localhost/tasks?id=test-task-id', {
        method: 'DELETE',
        headers: { 'authorization': 'Bearer test-token' }
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(204);
    });

    it('should return 400 if task ID is missing', async () => {
      const request = new Request('http://localhost/tasks', {
        method: 'DELETE',
        headers: { 'authorization': 'Bearer test-token' }
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error', 'Task ID is required');
    });
  });

  describe('Error handling', () => {
    it('should return 401 for unauthorized requests', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = new Request('http://localhost/tasks', {
        method: 'GET',
        headers: { 'authorization': 'Bearer invalid-token' }
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(401);

      const result = await response.json();
      expect(result).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 500 for database errors', async () => {
      mockSupabaseClient.select.mockResolvedValue({ data: null, error: new Error('Database error') });

      const request = new Request('http://localhost/tasks', {
        method: 'GET',
        headers: { 'authorization': 'Bearer test-token' }
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(500);

      const result = await response.json();
      expect(result).toHaveProperty('error', 'Internal server error');
    });

    it('should return 405 for unsupported methods', async () => {
      const request = new Request('http://localhost/tasks', {
        method: 'PATCH',
        headers: { 'authorization': 'Bearer test-token' }
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(405);

      const result = await response.json();
      expect(result).toHaveProperty('error', 'Method not allowed');
    });
  });
}); 