# Scripts de Base de Datos

## Fix Schema Script

Este script corrige automáticamente el esquema de la base de datos agregando las columnas faltantes a la tabla `users`.

### Uso

1. Asegúrate de que tu archivo `.env` esté configurado con `DATABASE_URL`
2. Ejecuta el script:

```bash
npm run fix:schema
```

### Columnas que se agregan

- `emailVerified` (BOOLEAN, default: false)
- `verificationToken` (VARCHAR(255), nullable)
- `verificationTokenExpiry` (TIMESTAMP, nullable)
- `resetToken` (VARCHAR(255), nullable)
- `resetTokenExpiry` (TIMESTAMP, nullable)
- `createdAt` (TIMESTAMP, default: CURRENT_TIMESTAMP)
- `updatedAt` (TIMESTAMP, default: CURRENT_TIMESTAMP)

### Notas

- El script verifica si cada columna ya existe antes de agregarla
- No elimina ni modifica columnas existentes
- Es seguro ejecutarlo múltiples veces

