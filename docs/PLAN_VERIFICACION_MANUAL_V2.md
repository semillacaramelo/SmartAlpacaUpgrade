# Plan de Verificación Manual - Smart Alpaca Trading Platform v2.0

**Fecha**: Septiembre 19, 2025  
**Estado**: Post-Recuperación Crítica - Entorno Estabilizado  
**Arquitectura**: Frontend (Vite) + Backend (Express API) - Procesos Separados

---

## 🎯 **RESUMEN EJECUTIVO**

Este plan refleja la **arquitectura corregida** tras la recuperación crítica que resolvió la pantalla en blanco y los fallos de renderizado. El sistema ahora funciona con:

- ✅ **Entorno de desarrollo estabilizado**: Vite dev server (puerto 3000) + API server (puerto 5000)
- ✅ **Pruebas de conexión de API funcionales**: Settings page con validación real
- ✅ **Dashboard integrado con datos reales**: Conectado a useTradingData hook
- ✅ **Estados de "API no conectada"**: Guía clara al usuario hacia Settings

---

## 📋 **PRERREQUISITOS DE VERIFICACIÓN**

### A. Servicios de Base de Datos
```powershell
# 1. Verificar PostgreSQL
Get-Service -Name "*postgre*" | Where-Object {$_.Status -eq "Running"}

# 2. Verificar Redis
Test-NetConnection -ComputerName localhost -Port 6379

# 3. Iniciar servicios automáticamente
npm run start-services
```

### B. Variables de Entorno
```bash
# Archivo .env debe contener:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_alpaca
ALPACA_API_KEY=your_paper_trading_key
ALPACA_SECRET_KEY=your_paper_trading_secret
ALPACA_BASE_URL=https://paper-api.alpaca.markets
GEMINI_API_KEY=your_gemini_ai_key
```

---

## 🚀 **PROCESO DE VERIFICACIÓN PASO A PASO**

### **ETAPA 1: Inicialización del Entorno**

#### 1.1 Iniciar Desarrollo
```powershell
# Terminal 1: Iniciar entorno completo
npm run dev

# Resultado esperado:
# ✅ Vite dev server en http://localhost:3000
# ✅ API server en http://localhost:5000
# ✅ Ambos procesos ejecutándose en paralelo sin errores
```

#### 1.2 Verificar Conectividad
- **Frontend**: Abrir `http://localhost:3000`
- **Resultado esperado**: Dashboard de Smart Alpaca se carga correctamente
- **API**: Verificar `http://localhost:5000/api/health` responde JSON válido

---

### **ETAPA 2: Verificación de Estados de UI**

#### 2.1 Dashboard - Estado "API No Conectada"
**Pasos:**
1. Asegurar que no hay credenciales válidas en .env (comentar temporalmente)
2. Recargar la página
3. **Resultado esperado**:
   - Alert amarillo: "API Connection Required"
   - Tarjetas del portfolio muestran "--" y "API Required"
   - Link "Go to Settings →" funciona

#### 2.2 Dashboard - Estado con Datos Reales
**Pasos:**
1. Restaurar credenciales válidas en .env
2. Reiniciar el servidor API
3. **Resultado esperado**:
   - Portfolio Value: Valor real de la cuenta paper trading
   - Daily P&L: Cálculo real con colores verdes/rojos
   - Active Positions: Número real de posiciones abiertas
   - Trading Status: "Active" con cash balance real
   - Indicador "Live" en verde si WebSocket conectado

---

### **ETAPA 3: Verificación de Settings y Conexiones API**

#### 3.1 Configuración de Alpaca API
**Pasos:**
1. Navegar a `/settings`
2. Introducir credenciales válidas de Alpaca paper trading
3. Hacer clic en "Test Alpaca Connection"
4. **Resultado esperado**:
   - Loading spinner durante la prueba
   - Alert verde con "Success" y datos de cuenta
   - Si falla: Alert rojo con mensaje específico del error

#### 3.2 Configuración de Gemini AI
**Pasos:**
1. Introducir API key válida de Gemini
2. Hacer clic en "Test Gemini Connection"
3. **Resultado esperado**:
   - Loading spinner durante la prueba
   - Alert verde con "Gemini API connection successful!"
   - Si falla: Alert rojo con mensaje específico del error

#### 3.3 Validación de Credenciales Incorrectas
**Pasos:**
1. Introducir credenciales inválidas
2. Probar conexiones
3. **Resultado esperado**:
   - Errores claros y específicos
   - No crashes o comportamientos indefinidos
   - Mensajes informativos para el usuario

---

### **ETAPA 4: Verificación de Navegación y Rutas**

#### 4.1 Navegación Principal
**Páginas a verificar:**
- `/` (Dashboard) ✅ Completamente funcional
- `/dashboard` ✅ Completamente funcional  
- `/settings` ✅ Completamente funcional
- `/portfolio` ⚠️ Parcialmente funcional (datos hardcodeados)
- `/strategies` ⚠️ Pendiente verificación
- `/backtest` ⚠️ Pendiente verificación
- `/risk` ⚠️ Pendiente verificación
- `/audit` ⚠️ Pendiente verificación
- `/monitoring` ⚠️ Pendiente verificación

#### 4.2 Características de Navegación
- **Sidebar**: Se mantiene visible y responsive
- **Rutas**: No hay errores 404 en páginas principales
- **State management**: Navegación preserva estado de la aplicación

---

### **ETAPA 5: Verificación de APIs y WebSocket**

#### 5.1 Endpoints de API
```bash
# Verificar endpoints principales:
curl http://localhost:5000/api/health
curl http://localhost:5000/api/portfolio/status
curl http://localhost:5000/api/positions/open
curl http://localhost:5000/api/system/metrics
```

#### 5.2 WebSocket Conectividad
**Pasos:**
1. Abrir Developer Tools → Network → WS
2. Verificar conexión WebSocket activa
3. **Resultado esperado**:
   - Conexión `ws://localhost:5000/ws` establecida
   - Indicador "Live" en Dashboard en verde
   - Actualizaciones en tiempo real funcionando

---

### **ETAPA 6: Verificación de Resilencia y Manejo de Errores**

#### 6.1 Recuperación de Fallos de Red
**Pasos:**
1. Detener el servidor API temporalmente
2. Verificar comportamiento del frontend
3. **Resultado esperado**:
   - Estados de loading apropiados
   - No crashes del frontend
   - Reconexión automática al restaurar API

#### 6.2 Datos Inválidos o Faltantes
**Pasos:**
1. Simular respuestas vacías de API
2. **Resultado esperado**:
   - Valores por defecto mostrados (ej: $0.00)
   - No errores de JavaScript en consola
   - UX degradada pero funcional

---

## ✅ **CRITERIOS DE ACEPTACIÓN**

### **Funcionalidad Crítica - DEBE FUNCIONAR**
- [ ] Dashboard se carga sin pantalla en blanco
- [ ] Settings page permite probar conexiones API reales
- [ ] Estados "API no conectada" guían al usuario apropiadamente  
- [ ] Navegación entre páginas funciona sin errores
- [ ] WebSocket muestra estado de conectividad
- [ ] No errores de compilación TypeScript
- [ ] No errores críticos en consola del navegador

### **Funcionalidad Avanzada - DEBERÍA FUNCIONAR**
- [ ] Portfolio page muestra datos reales (actualmente parcial)
- [ ] AI Pipeline muestra estados reales de procesamiento
- [ ] Actualizaciones en tiempo real via WebSocket
- [ ] Todas las páginas muestran datos reales vs simulados

### **Funcionalidad Futura - PUEDE DIFERIRSE**
- [ ] Gráficos y visualizaciones avanzadas
- [ ] Funcionalidades de backtesting completo
- [ ] Trading en vivo (por seguridad, mantener paper trading)

---

## 🚨 **PROBLEMAS CONOCIDOS Y LIMITACIONES**

### **Resueltos en Esta Versión**
- ✅ **Pantalla en blanco**: Completamente resuelto con separación Vite/Express
- ✅ **Pruebas de API fallidas**: Completamente resuelto con inyección de credenciales
- ✅ **Estados de UI indefinidos**: Resuelto con manejo apropiado de "API no conectada"

### **Pendientes para Futuras Versiones**
- ⚠️ **Portfolio page**: Aún contiene algunos datos hardcodeados
- ⚠️ **Páginas secundarias**: Backtest, Strategies, etc. requieren integración completa
- ⚠️ **Gráficos**: Placeholders en lugar de visualizaciones reales
- ⚠️ **Testing E2E**: Cobertura de tests automatizados

---

## 🛠 **HERRAMIENTAS DE DEPURACIÓN**

### **Comandos Útiles**
```powershell
# Verificar estado de servicios
npm run start-services

# Logs del servidor
npm run dev:server

# Solo frontend para depuración
npm run dev:client

# Verificar salud del sistema
curl http://localhost:5000/api/health | ConvertFrom-Json
```

### **Puntos de Verificación en Código**
- `client/src/hooks/use-trading-data.tsx`: Estado de conexión API
- `client/src/pages/dashboard.tsx`: Lógica de datos reales vs placeholder
- `client/src/pages/Settings.tsx`: Lógica de pruebas de conexión
- `server/routes.ts`: Endpoints `/api/test/*` para validación

---

## 📊 **MÉTRICAS DE ÉXITO**

| Componente | Estado Anterior | Estado Actual | Objetivo |
|------------|----------------|---------------|----------|
| Renderizado | ❌ Pantalla en blanco | ✅ Funcional | ✅ |
| API Tests | ❌ Siempre fallan | ✅ Funcional | ✅ |
| Dashboard | ❌ Solo datos fake | ✅ Datos reales | ✅ |
| Settings | ❌ No funcional | ✅ Completamente funcional | ✅ |
| Portfolio | ⚠️ Datos mixtos | ⚠️ Parcialmente real | 🎯 Meta futura |

---

**Preparado por**: IA Desarrolladora (Cline)  
**Validado**: Post-recuperación crítica exitosa  
**Próxima revisión**: Tras integración completa de páginas restantes
