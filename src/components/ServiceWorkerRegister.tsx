"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Programmatically clean up service workers in development to avoid stale caching issues
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log("Stale Service Worker programmatically unregistered in development mode.");
              // Trigger a clean reload to let browser load assets directly from dev server
              if (typeof window !== "undefined" && !sessionStorage.getItem("sw-dev-reloaded")) {
                sessionStorage.setItem("sw-dev-reloaded", "true");
                window.location.reload();
              }
            }
          });
        }
      });
      // Clean up local cache storages in development
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
