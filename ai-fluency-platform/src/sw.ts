import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Never cache API or auth routes
    {
      matcher: /\/api\/.*/i,
      handler: new NetworkOnly(),
    },
    {
      matcher: /\/auth\/.*/i,
      handler: new NetworkOnly(),
    },
    // Use sensible defaults for everything else
    ...defaultCache,
  ],
});

serwist.addEventListeners();
