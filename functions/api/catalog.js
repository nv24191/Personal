import { handleCatalog } from '../_lib/admin.js';

export async function onRequest(context) {
  try {
    return await handleCatalog(context.request, context.env);
  } catch (error) {
    console.error('Catalog function failed:', error);
    return new Response(JSON.stringify({ error: 'The game catalog is temporarily unavailable.' }), {
      status: 500,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}
