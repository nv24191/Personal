export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (!/\bgzip\b/i.test(context.request.headers.get('accept-encoding') || '')) {
    return new Response('This game asset requires gzip support.', { status: 406 });
  }
  const manifestResponse = await context.env.ASSETS.fetch(new URL('/octo-compressed-assets.json', url));
  if (!manifestResponse.ok) return context.env.ASSETS.fetch(context.request);
  const manifest = await manifestResponse.json();
  const asset = manifest[url.pathname];
  if (!asset) return context.env.ASSETS.fetch(context.request);

  const compressedUrl = new URL(asset.file, url);
  const compressedResponse = await context.env.ASSETS.fetch(compressedUrl);
  if (!compressedResponse.ok) return compressedResponse;
  const headers = new Headers(compressedResponse.headers);
  headers.set('Content-Encoding', 'gzip');
  headers.set('Vary', 'Accept-Encoding');
  headers.set('Content-Type', asset.contentType);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(compressedResponse.body, { headers });
}
