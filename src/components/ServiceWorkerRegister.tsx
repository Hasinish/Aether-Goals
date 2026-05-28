"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && (window as typeof globalThis & { workbox?: unknown }).workbox === undefined) {
      const handleLoad = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => {})
          .catch(() => {});
      };

      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  return null;
}
