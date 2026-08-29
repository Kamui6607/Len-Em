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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

