export default function SuperSimpleApp() {
    return (
        <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
            <h1 style={{ color: '#3b82f6', fontSize: '2rem', marginBottom: '20px' }}>
                🚀 Smart Alpaca Trading Platform
            </h1>

            <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>✅ React Funcionando</h2>
                <p style={{ marginBottom: '10px' }}>Si puedes ver este mensaje, React está cargando correctamente.</p>
                <p style={{ marginBottom: '10px' }}>Servidor: localhost:5000</p>
                <p>Estado: Conectado</p>
            </div>

            <div style={{ backgroundColor: '#1e3a8a', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                <strong>Siguiente paso:</strong> Una vez que veas esto, podemos restaurar gradualmente
                las funcionalidades completas de la aplicación.
            </div>
        </div>
    );
}