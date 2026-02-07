import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handlers to prevent white screen crashes
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Unhandled Promise Rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser error page
});

window.addEventListener('error', (event) => {
  console.error('[Global] Uncaught Error:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);