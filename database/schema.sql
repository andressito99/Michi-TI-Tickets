-- SPDX-License-Identifier: Apache-2.0
-- Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

-- ─────────────────────────────────────────────────────────────
--  TI-Tickets — esquema MySQL (compatible con MAMP / MySQL 5.7+)
--  Importar desde phpMyAdmin o con:  npm run db:init  (en backend/)
-- ─────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS ti_tickets
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ti_tickets;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS Usuarios (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Usuario       VARCHAR(100) NOT NULL,
  `Contraseña`  VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt',
  Rol           VARCHAR(20)  NOT NULL DEFAULT 'usuario' COMMENT 'usuario | agente | admin',
  Correo        VARCHAR(191) NULL,
  Departmento   VARCHAR(100) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_usuario (Usuario),
  UNIQUE KEY uq_usuarios_correo  (Correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Agentes (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Nombre        VARCHAR(100) NOT NULL,
  Especialidad  VARCHAR(150) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Incidentes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Categoria  VARCHAR(100) NOT NULL,
  Incidente  VARCHAR(191) NOT NULL,
  Tiempo     VARCHAR(50)  NULL COMMENT 'Tiempo estimado de resolución',
  Prioridad  VARCHAR(20)  NULL COMMENT 'urgent | high | medium | low',
  Agentes    INT UNSIGNED NULL COMMENT 'Agente asignado por defecto (Agentes.id)',
  PRIMARY KEY (id),
  KEY idx_incidentes_categoria (Categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Tickets (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Usuario       INT UNSIGNED NULL,
  Departamento  VARCHAR(100) NULL,
  Status        VARCHAR(30)  NOT NULL DEFAULT 'open',
  Incidente_ID  INT UNSIGNED NULL,
  Fecha         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'UTC',
  Descripcion   TEXT         NULL,
  Prioridad     VARCHAR(20)  NULL,
  Agente        INT UNSIGNED NULL,
  comment       TEXT         NULL,
  PRIMARY KEY (id),
  KEY idx_tickets_usuario (Usuario),
  KEY idx_tickets_agente  (Agente),
  KEY idx_tickets_fecha   (Fecha),
  CONSTRAINT fk_tickets_usuario   FOREIGN KEY (Usuario)      REFERENCES Usuarios (id)   ON DELETE SET NULL,
  CONSTRAINT fk_tickets_incidente FOREIGN KEY (Incidente_ID) REFERENCES Incidentes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Otros_incidentes (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Usuario_ID    INT UNSIGNED NULL,
  Departamento  VARCHAR(100) NULL,
  Status        VARCHAR(30)  NOT NULL DEFAULT 'Pendiente',
  Categoria     VARCHAR(100) NULL,
  Fecha         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'UTC',
  Descripcion   TEXT         NULL,
  Prioridad     VARCHAR(20)  NULL,
  Agente        INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_otros_usuario (Usuario_ID),
  CONSTRAINT fk_otros_usuario FOREIGN KEY (Usuario_ID) REFERENCES Usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- "incidente_id" apunta a Tickets.id (se conserva el nombre original de Supabase)
CREATE TABLE IF NOT EXISTS Conversaciones (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  incidente_id       INT UNSIGNED NOT NULL,
  mensaje            TEXT         NOT NULL,
  fecha_publicacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'UTC',
  Usuario_ID         INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_conv_ticket (incidente_id, fecha_publicacion),
  CONSTRAINT fk_conv_ticket  FOREIGN KEY (incidente_id) REFERENCES Tickets (id)  ON DELETE CASCADE,
  CONSTRAINT fk_conv_usuario FOREIGN KEY (Usuario_ID)   REFERENCES Usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Foro de soluciones ──────────────────────────────────────
-- Casos resueltos publicados de forma anónima. Ticket_ID y Propuesto_por
-- son solo para uso interno del admin: la API pública nunca los expone.
CREATE TABLE IF NOT EXISTS Foro_publicaciones (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Titulo         VARCHAR(191) NOT NULL,
  Categoria      VARCHAR(100) NULL,
  Problema       TEXT         NOT NULL,
  Solucion       TEXT         NULL,
  Estado         VARCHAR(20)  NOT NULL DEFAULT 'propuesta' COMMENT 'propuesta | publicado | oculto',
  Ticket_ID      INT UNSIGNED NULL,
  Propuesto_por  INT UNSIGNED NULL COMMENT 'Usuario que propuso el caso (privado)',
  Publicado_por  INT UNSIGNED NULL,
  Vistas         INT UNSIGNED NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at   DATETIME     NULL,
  updated_at     DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_foro_ticket (Ticket_ID),
  KEY idx_foro_estado (Estado, published_at),
  CONSTRAINT fk_foro_ticket     FOREIGN KEY (Ticket_ID)     REFERENCES Tickets (id)  ON DELETE SET NULL,
  CONSTRAINT fk_foro_propuesto  FOREIGN KEY (Propuesto_por) REFERENCES Usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_foro_publicado  FOREIGN KEY (Publicado_por) REFERENCES Usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Foro_votos (
  Publicacion_ID INT UNSIGNED NOT NULL,
  Usuario_ID     INT UNSIGNED NOT NULL,
  Util           TINYINT(1)   NOT NULL,
  PRIMARY KEY (Publicacion_ID, Usuario_ID),
  CONSTRAINT fk_voto_pub FOREIGN KEY (Publicacion_ID) REFERENCES Foro_publicaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_voto_usr FOREIGN KEY (Usuario_ID)     REFERENCES Usuarios (id)           ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario_ID se guarda para moderar y para que cada quien borre lo suyo;
-- si Anonimo = 1 la API nunca devuelve el nombre.
CREATE TABLE IF NOT EXISTS Foro_comentarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Publicacion_ID  INT UNSIGNED NOT NULL,
  Usuario_ID      INT UNSIGNED NULL,
  Mensaje         TEXT         NOT NULL,
  Anonimo         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_com_pub (Publicacion_ID, created_at),
  CONSTRAINT fk_com_pub FOREIGN KEY (Publicacion_ID) REFERENCES Foro_publicaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_com_usr FOREIGN KEY (Usuario_ID)     REFERENCES Usuarios (id)           ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Capturas adjuntas ───────────────────────────────────────
-- Las imágenes se guardan en disco (backend/uploads, fuera de la web) con un nombre
-- aleatorio; aquí solo va su información. Pertenecen a un ticket (y opcionalmente a un
-- mensaje de su conversación) o a un reporte "Otro" todavía sin convertir.
CREATE TABLE IF NOT EXISTS Adjuntos (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Ticket_ID        INT UNSIGNED NULL,
  Otro_ID          INT UNSIGNED NULL,
  Conversacion_ID  INT UNSIGNED NULL,
  Usuario_ID       INT UNSIGNED NULL,
  Nombre           VARCHAR(191) NOT NULL COMMENT 'Nombre original (saneado)',
  Archivo          VARCHAR(100) NOT NULL COMMENT 'Nombre aleatorio en disco',
  Tipo             VARCHAR(50)  NOT NULL COMMENT 'image/png, image/jpeg, image/gif o image/webp',
  Tamano           INT UNSIGNED NOT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_adj_ticket (Ticket_ID),
  KEY idx_adj_otro   (Otro_ID),
  KEY idx_adj_conv   (Conversacion_ID),
  CONSTRAINT fk_adj_ticket  FOREIGN KEY (Ticket_ID)       REFERENCES Tickets (id)          ON DELETE CASCADE,
  CONSTRAINT fk_adj_otro    FOREIGN KEY (Otro_ID)         REFERENCES Otros_incidentes (id) ON DELETE CASCADE,
  CONSTRAINT fk_adj_conv    FOREIGN KEY (Conversacion_ID) REFERENCES Conversaciones (id)   ON DELETE CASCADE,
  CONSTRAINT fk_adj_usuario FOREIGN KEY (Usuario_ID)      REFERENCES Usuarios (id)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
