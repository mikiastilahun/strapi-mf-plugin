export default [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "frame-src": ["'self'", "blob:", "https:", "http:"],
          "script-src": [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https:",
            "http:",
          ],
          "script-src-elem": ["'self'", "'unsafe-inline'", "https:", "http:"],
          "connect-src": ["'self'", "https:", "http:"],
          "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
          "style-src": ["'self'", "'unsafe-inline'", "https:", "http:"],
          "style-src-elem": ["'self'", "'unsafe-inline'", "https:", "http:"],
          "worker-src": ["'self'", "blob:"],
        },
      },
    },
  },
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
