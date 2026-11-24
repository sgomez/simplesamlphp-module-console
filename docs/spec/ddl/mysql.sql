-- Console schema for MariaDB (minimum 10.11) and MySQL (minimum 8.4).
-- Table names are shown with an empty `database.prefix`; the prefix goes before `console_`.
-- Each numbered block is one migration and holds exactly one statement.

-- Created by the migration runner itself, before any migration.
CREATE TABLE IF NOT EXISTS console_schema_version (
    version    INT      NOT NULL PRIMARY KEY,
    applied_at CHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1
CREATE TABLE console_entity (
    entity_set           VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    entity_id            VARBINARY(1024) NOT NULL,
    enabled              TINYINT         NOT NULL,
    document             LONGTEXT        NOT NULL,
    version              INT             NOT NULL,
    external_fingerprint CHAR(64),
    created_at           CHAR(20)        NOT NULL,
    updated_at           CHAR(20)        NOT NULL,
    PRIMARY KEY (entity_set, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2
CREATE TABLE console_authsource (
    id         VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
    type       VARCHAR(64)  NOT NULL,
    enabled    TINYINT      NOT NULL,
    document   LONGTEXT     NOT NULL,
    version    INT          NOT NULL,
    created_at CHAR(20)     NOT NULL,
    updated_at CHAR(20)     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3
CREATE TABLE console_snapshot (
    number         INT          NOT NULL PRIMARY KEY,
    format_version INT          NOT NULL,
    checksum       CHAR(64)     NOT NULL,
    document       LONGTEXT     NOT NULL,
    comment        TEXT,
    created_at     CHAR(20)     NOT NULL,
    created_by     VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4
CREATE TABLE console_pointer (
    id             SMALLINT NOT NULL PRIMARY KEY CHECK (id = 1),
    current_number INT,
    last_number    INT      NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5
INSERT INTO console_pointer (id, current_number, last_number) VALUES (1, NULL, 0);

-- 6
CREATE TABLE console_node (
    identifier    VARCHAR(255) NOT NULL PRIMARY KEY,
    served_number INT,
    checked_at    CHAR(20)     NOT NULL,
    has_problems  TINYINT      NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7
CREATE TABLE console_audit (
    id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    at             CHAR(20)     NOT NULL,
    identity       VARCHAR(255) NOT NULL,
    action         VARCHAR(32)  NOT NULL,
    object_type    VARCHAR(16),
    entity_set     VARCHAR(32)  CHARACTER SET ascii COLLATE ascii_bin,
    entity_id      VARBINARY(1024),
    authsource_id  VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin,
    document       LONGTEXT,
    snapshot_from  INT,
    snapshot_to    INT,
    comment        TEXT,
    schema_version INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8
CREATE INDEX console_audit_entity ON console_audit (entity_set, entity_id);

-- 9
CREATE INDEX console_audit_authsource ON console_audit (authsource_id);
