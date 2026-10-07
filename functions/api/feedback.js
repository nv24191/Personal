import { handleFeedback } from '../_lib/admin.js';

export async function onRequest(context) {
  try {
    return await handleFeedback(context.request, context.env);
  } catch (error) {
    console.error('Feedback submission failed:', error);
    return new Response(JSON.stringify({
      error: error.status && error.status < 500 ? error.message : 'The feedback service could not save your submission.',
    }), {
      status: error.status || 500,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
}
