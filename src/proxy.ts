import { NextResponse } from "next/server";
import { auth } from "@/shared/lib/auth";

export const proxy = auth((request) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Clonamos el request de los headers para poder inyectar CSP y otros
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://browser.sentry-cdn.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    connect-src 'self' data: blob: https: http: wss: ws:;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' blob:;
    frame-ancestors 'none';
    ${process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : ""}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  requestHeaders.set("Content-Security-Policy", cspHeader);

  // Crear la respuesta y aplicar los headers a la salida
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
});

// Configuración para que el middleware no intercepte rutas estáticas o del api que no queramos
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
