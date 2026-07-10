import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://devpulse.sangamkunwar.com.np";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", priority: "1.0" },
          { path: "/learn", priority: "0.8" },
          { path: "/auth", priority: "0.5" },
          { path: "/terms", priority: "0.3" },
          { path: "/privacy", priority: "0.3" },
        ];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map(
            (e) => `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <priority>${e.priority}</priority>\n  </url>`,
          ),
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
