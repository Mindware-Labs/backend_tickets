-- Script para corregir el esquema de la base de datos
-- Agrega las columnas faltantes a la tabla users

-- Verificar y agregar emailVerified si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'emailVerified'
    ) THEN
        ALTER TABLE users ADD COLUMN "emailVerified" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Verificar y agregar verificationToken si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verificationToken'
    ) THEN
        ALTER TABLE users ADD COLUMN "verificationToken" VARCHAR(255);
    END IF;
END $$;

-- Verificar y agregar verificationTokenExpiry si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verificationTokenExpiry'
    ) THEN
        ALTER TABLE users ADD COLUMN "verificationTokenExpiry" TIMESTAMP;
    END IF;
END $$;

-- Verificar y agregar resetToken si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'resetToken'
    ) THEN
        ALTER TABLE users ADD COLUMN "resetToken" VARCHAR(255);
    END IF;
END $$;

-- Verificar y agregar resetTokenExpiry si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'resetTokenExpiry'
    ) THEN
        ALTER TABLE users ADD COLUMN "resetTokenExpiry" TIMESTAMP;
    END IF;
END $$;

-- Verificar y agregar createdAt si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE users ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Verificar y agregar updatedAt si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE users ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Mensaje de confirmación
SELECT 'Database schema updated successfully!' AS message;

