# PostgreSQL PATH Configuration - Smart Alpaca

Este directorio contiene scripts para configurar PostgreSQL en el PATH del sistema Windows, permitiendo usar `psql` directamente desde cualquier terminal.

## Scripts Disponibles

### 1. `setup-postgresql-path.ps1` (Recomendado)
Script principal que maneja toda la configuración automáticamente.

```powershell
# Configurar para el usuario actual (no requiere admin)
.\scripts\setup-postgresql-path.ps1

# Configurar para todo el sistema (requiere admin)
.\scripts\setup-postgresql-path.ps1 -SystemWide

# Ver ayuda
.\scripts\setup-postgresql-path.ps1 -Help
```

### 2. `add-postgresql-to-path.ps1`
Script detallado con opciones específicas.

```powershell
# Verificar estado actual
.\scripts\add-postgresql-to-path.ps1 -Check

# Agregar para usuario actual
.\scripts\add-postgresql-to-path.ps1 -User

# Agregar para todo el sistema (requiere admin)
.\scripts\add-postgresql-to-path.ps1 -Global
```

### 3. `add-postgresql-system-path.ps1`
Script específico para PATH del sistema (solo administrador).

```powershell
# Ejecutar como administrador
.\scripts\add-postgresql-system-path.ps1
```

## Uso Rápido

### Configuración para Usuario (Recomendado)
```powershell
# Ejecutar en PowerShell normal
.\scripts\setup-postgresql-path.ps1

# Reiniciar terminal y verificar
psql --version
```

### Configuración para Todo el Sistema
```powershell
# Esto abrirá una ventana de administrador automáticamente
.\scripts\setup-postgresql-path.ps1 -SystemWide

# O manualmente como administrador:
# 1. Abrir PowerShell como Administrador
# 2. cd "ruta\al\proyecto"
# 3. .\scripts\add-postgresql-system-path.ps1
```

## Después de la Configuración

1. **Reinicia VS Code** completamente
2. **Abre un nuevo terminal**
3. **Verifica que funciona:**
   ```powershell
   psql --version
   psql -U smart_alpaca_user -h localhost -d smart_alpaca
   ```

## Beneficios

✅ **Antes**: `& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U user -d db`
✅ **Después**: `psql -U user -d db`

- Comandos más simples y legibles
- Scripts más portables
- Desarrollo más eficiente
- Consistencia con entornos Linux/macOS

## Troubleshooting

### El comando `psql` no se encuentra
1. Verifica que ejecutaste el script de configuración
2. Reinicia completamente el terminal
3. Verifica con: `$env:PATH -split ';' | Where-Object {$_ -like "*PostgreSQL*"}`

### "No se puede ejecutar como administrador"
1. Asegúrate de que PowerShell puede ejecutar scripts: `Set-ExecutionPolicy RemoteSigned`
2. Ejecuta manualmente como administrador
3. O configura solo para usuario: `.\scripts\setup-postgresql-path.ps1`

### Funciona en un terminal pero no en otro
- Reinicia VS Code completamente
- Algunos terminales pueden requerir reinicio del sistema