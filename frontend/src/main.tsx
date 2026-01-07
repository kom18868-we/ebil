import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import i18n config to initialize it
import "./lib/i18n/config";

createRoot(document.getElementById("root")!).render(<App />);
