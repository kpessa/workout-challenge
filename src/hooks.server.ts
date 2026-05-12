import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // The CSP is already handled by the app, but we can strengthen it here if needed
  const existingCSP = response.headers.get('Content-Security-Policy');
  if (!existingCSP) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebase.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com; " +
      "frame-src 'self' https://*.firebaseapp.com https://*.firebase.google.com;"
    );
  }
  
  return response;
};