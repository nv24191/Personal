import { handleAdmin } from '../../_lib/admin.js';

export async function onRequest(context) {
  try {
    return await handleAdmin(context.request, context.env);
  } catch (error) {
    console.error('Admin function failed:', error);
    return new Response(JSON.stringify({
      error: error.status && error.status < 500 ? error.message : 'The admin service could not complete the request.',
    }), {
      status: error.status || (error instanceof URIError ? 400 : 500),
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}
