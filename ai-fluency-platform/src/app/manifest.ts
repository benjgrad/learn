import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Palestra",
    short_name: "Palestra",
    description:
      "Earned mastery through active practice, spaced repetition, and AI-powered drills. Learn skills that stick.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Reuse the running PWA window when an email sign-in link is captured
    // (Chromium only; iOS Safari never captures links into a home-screen app).
    launch_handler: { client_mode: "navigate-existing" },
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
