// Versión mínima sin dependencias complejas
export default function MinimalApp() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-5 font-sans">
      <h1 className="text-blue-500 text-3xl mb-5">
        🚀 Smart Alpaca Trading Platform
      </h1>
      
      <div className="bg-gray-800 p-5 rounded-lg mb-5">
        <h2 className="text-xl mb-3">✅ Sistema Funcionando</h2>
        <p className="mb-2">Si puedes ver este mensaje, el frontend está cargando correctamente.</p>
        <p className="mb-2">Servidor: localhost:5000</p>
        <p>Estado: Conectado</p>
      </div>

      <div className="bg-blue-900 p-4 rounded-lg border border-blue-500">
        <strong>Siguiente paso:</strong> Una vez que veas esto, podemos restaurar gradualmente 
        las funcionalidades completas de la aplicación.
      </div>
    </div>
  );
}