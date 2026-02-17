import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return [
      // Backwards compat: old AI Fluency URLs -> new course-prefixed URLs
      {
        source: "/learn/foundations/:slug*",
        destination: "/learn/ai-fluency/foundations/:slug*",
        permanent: true,
      },
      {
        source: "/learn/level-:num/:slug*",
        destination: "/learn/ai-fluency/level-:num/:slug*",
        permanent: true,
      },
      {
        source: "/learn/getting-started",
        destination: "/learn/ai-fluency/getting-started",
        permanent: true,
      },
      {
        source: "/learn/glossary",
        destination: "/learn/ai-fluency/glossary",
        permanent: true,
      },
      // Backwards compat: old single CFA course -> split courses
      {
        source: "/learn/cfa/level-1/:slug*",
        destination: "/learn/cfa-1/level-1/:slug*",
        permanent: true,
      },
      {
        source: "/learn/cfa/level-2/:slug*",
        destination: "/learn/cfa-2/level-2/:slug*",
        permanent: true,
      },
      {
        source: "/learn/cfa/level-3/:slug*",
        destination: "/learn/cfa-3/level-3/:slug*",
        permanent: true,
      },
      {
        source: "/curriculum/cfa",
        destination: "/curriculum/cfa-1",
        permanent: true,
      },
    ];
  },
};

export default withSerwist(nextConfig);
