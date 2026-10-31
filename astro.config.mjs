import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://massgame-archive.com",
  output: "static",
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  markdown: { syntaxHighlight: false },
  // Astro hashes its island bootstrap scripts for the production CSP.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "connect-src 'self' https://formspree.io",
        "frame-src https://www.youtube.com",
        "form-action 'self' https://formspree.io",
        "base-uri 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ],
    },
  },
});
