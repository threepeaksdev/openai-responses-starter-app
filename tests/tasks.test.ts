import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import { jest } from '@jest/globals';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [], error: null, count: 0 })).mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
    })),
  })),
}));

// Test the tasks function
describe('Tasks Function', () => {
  it('should handle GET requests', async () => {
    // Mock request and response objects
    const req = new IncomingMessage(new Socket());
    req.method = 'GET';
    req.url = '/?search_term=test';
    const res = new ServerResponse(req);
    res.writeHead = jest.fn() as any;
    res.end = jest.fn() as any;

    // Call the server function
    await createServer(req as any, res as any);

    // Check that the response was sent
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('data'));
  });

  it('should handle POST requests', async () => {
    // Mock request and response objects
    const req = new IncomingMessage(new Socket());
    req.method = 'POST';
    req.url = '/';
    req.on = jest.fn((event: string, callback: Function) => {
      if (event === 'data') callback(Buffer.from(JSON.stringify({ title: 'Test Task' })));
      if (event === 'end') callback();
    }) as any;
    const res = new ServerResponse(req);
    res.writeHead = jest.fn() as any;
    res.end = jest.fn() as any;

    // Call the server function
    await createServer(req as any, res as any);

    // Check that the response was sent
    expect(res.writeHead).toHaveBeenCalledWith(201, expect.any(Object));
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('Test Task'));
  });
}); 