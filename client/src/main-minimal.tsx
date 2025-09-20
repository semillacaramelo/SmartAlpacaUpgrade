import { createRoot } from "react-dom/client";
import MinimalApp from "./MinimalApp";
import "./index.css";

// Usar aplicación mínima para debugging
createRoot(document.getElementById("root")!).render(<MinimalApp />);