import { createRoot } from "react-dom/client";
import "./index.css";

function TestApp() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🚀 Smart Alpaca Trading Platform</h1>
      <p>✅ La aplicación React se está cargando correctamente!</p>
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
        <h3>Estado del Sistema:</h3>
        <ul>
          <li>✅ Servidor Express: Funcionando en puerto 5000</li>
          <li>✅ Vite: Integrado con servidor Express</li>
          <li>✅ React: Cargando correctamente</li>
          <li>⏳ Base de datos: PostgreSQL configurada</li>
          <li>⏳ Redis: Configurado para jobs</li>
        </ul>
      </div>
      <div style={{ marginTop: "20px" }}>
        <button 
          onClick={() => alert("¡La aplicación funciona correctamente!")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Probar Funcionalidad
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<TestApp />);