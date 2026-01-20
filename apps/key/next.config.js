/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  async headers() {
    // Allow embedding from any HTTPS origin for SDK iframe integration
    // This is safe because:
    // - User explicitly completes auth flow (consents)
    // - Only user's own identity is returned
    // - No secrets sent to external origin
    // - Similar to OAuth redirect_uri model
    const authFrameAncestors =
      "'self' https: http://localhost:* http://127.0.0.1:*";

    return [
      {
        source: "/auth",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "publickey-credentials-get=*, publickey-credentials-create=*",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://rpc.porto.sh https://*.porto.sh wss://*.porto.sh",
              "frame-src 'self' https://id.porto.sh",
              `frame-ancestors ${authFrameAncestors}`,
            ].join("; "),
          },
        ],
      },
      {
        source: "/:path((?!auth).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
