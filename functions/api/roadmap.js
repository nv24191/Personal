import { handleRoadmap } from '../_lib/admin.js';

export async function onRequest(context) {
  try {
    return await handleRoadmap(context.request, context.env);
  } catch (error) {
    console.error('Roadmap function failed:', error);
    return new Response(JSON.stringify({ error: 'The roadmap is temporarily unavailable.' }), {
      status: 500,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}