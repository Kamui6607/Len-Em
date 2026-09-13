import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./styles/safe-area.css";
import App from "./app/App";

// Đăng ký PWA service worker - nhưng BỎ QUA khi chạy bên trong app Tauri
// (desktop/mobile native không cần PWA, tránh lỗi custom protocol)
// Biến __TAURI_INTERNALS__ do Tauri inject vào runtime (Tauri v2)
const RUNNING_IN_TAURI =
  typeof window !== "undefined" &&
  "__TAURI_INTERNALS__" in window;

if (!RUNNING_IN_TAURI && import.meta.env.PROD) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

// Auto-reload ONCE when a dynamically imported chunk fails to load.
// This usually happens when a PWA service worker is still serving an OLD
// cached index.html that points to chunk files deleted by the newest deploy
// (e.g. users who still have `index-CcfloYvt.js` from an old build). Reloading
// pulls the fresh index.html + assets so users aren't stuck on a stale build.
// The sessionStorage guard prevents an infinite reload loop.
window.addEventListener("vite:preloadError", () => {
  if (sessionStorage.getItem("lenEm_preloadReloaded") !== "1") {
    sessionStorage.setItem("lenEm_preloadReloaded", "1");
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

