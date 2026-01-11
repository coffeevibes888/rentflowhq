import { NextRequest } from 'next/server';

// This is a placeholder route for WebSocket upgrade
// The actual WebSocket server will be initialized in the custom server
export async function GET(request: NextRequest) {
  return new Response('WebSocket endpoint - use custom server for WebSocket connections', {
    status: 426,
    headers: {
      'Upgrade': 'websocket',
    },
  });
}