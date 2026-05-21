-- ============================================================
-- Script de creación de base de datos y tabla de usuarios
-- Sistema Integral de Gestión de Leads
-- Evidencia: GA8-220501096-AA1-EV01
-- Motor: MySQL 9.5 (Community Server)
-- ============================================================
-- Este script debe ejecutarse una única vez desde MySQL Workbench
-- antes de iniciar el servidor Node.js por primera vez.
-- Crea la base de datos, la tabla de usuarios y un registro
-- administrador de prueba con contraseña hasheada por bcrypt.
-- ============================================================

-- Crear la base de datos si no existe.
-- utf8mb4 garantiza soporte completo de caracteres especiales en español.
CREATE DATABASE IF NOT EXISTS leads_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Seleccionar la base de datos para las instrucciones siguientes
USE leads_db;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- Almacena las credenciales y datos de acceso al sistema.
-- El campo password_hash nunca contiene texto plano —
-- solo el hash generado por bcrypt con costo mínimo 10.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id             INT           NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255)  NOT NULL,
  rol            ENUM('admin','asesor','supervisor') DEFAULT 'asesor',
  activo         TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Usuario administrador de prueba
-- Contraseña en texto plano: Admin2024*
-- Hash generado con bcrypt costo 10.
-- Cambiar la contraseña después del primer inicio de sesión.
-- INSERT IGNORE evita error si el script se ejecuta más de una vez.
-- ------------------------------------------------------------
INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
  'Administrador Sistema',
  'admin@leads.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.S',
  'admin'
);

-- Confirmar resultado de la ejecución
SELECT
  'Base de datos lista' AS estado,
  COUNT(*)              AS usuarios_registrados
FROM usuarios;
