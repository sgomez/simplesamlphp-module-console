-- Console schema for PostgreSQL (minimum 15).
-- Table names are shown with an empty `database.prefix`; the prefix goes before `console_`.
-- Each numbered block is one migration and holds exactly one statement.

-- Created by the migration runner itself, before any migration.
CREATE TABLE IF NOT EXISTS console_schema_version (
    version    INTEGER  NOT NULL PRIMARY KEY,
    applied_at CHAR(20) NOT NULL
);

-- 1
CREATE TABLE console_entity (
    entity_set           VARCHAR(32)      NOT NULL,
    entity_id            TEXT COLLATE "C" NOT NULL,
    enabled              SMALLINT         NOT NULL,
    document             TEXT             NOT NULL,
    version              INTEGER          NOT NULL,
    external_fingerprint CHAR(64),
    created_at           CHAR(20)         NOT NULL,
    updated_at           CHAR(20)         NOT NULL,
    PRIMARY KEY (entity_set, entity_id)
);

-- 2
CREATE TABLE console_authsource (
    id         VARCHAR(255) COLLATE "C" NOT NULL PRIMARY KEY,
    type       VARCHAR(64)              NOT NULL,
    enabled    SMALLINT                 NOT NULL,
    document   TEXT                     NOT NULL,
    version    INTEGER                  NOT NULL,
    created_at CHAR(20)                 NOT NULL,
    updated_at CHAR(20)                 NOT NULL
);

-- 3
CREATE TABLE console_snapshot (
    number         INTEGER      NOT NULL PRIMARY KEY,
    format_version INTEGER      NOT NULL,
    checksum       CHAR(64)     NOT NULL,
    document       TEXT         NOT NULL,
    comment        TEXT,
    created_at     CHAR(20)     NOT NULL,
    created_by     VARCHAR(255) NOT NULL
);

-- 4
CREATE TABLE console_pointer (
    id             SMALLINT NOT NULL PRIMARY KEY CHECK (id = 1),
    current_number INTEGER,
    last_number    INTEGER  NOT NULL DEFAULT 0
);

-- 5
INSERT INTO console_pointer (id, current_number, last_number) VALUES (1, NULL, 0);

-- 6
CREATE TABLE console_node (
    identifier    VARCHAR(255) NOT NULL PRIMARY KEY,
    served_number INTEGER,
    checked_at    CHAR(20)     NOT NULL,
    has_problems  SMALLINT     NOT NULL DEFAULT 0
);

-- 7
CREATE TABLE console_audit (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    at             CHAR(20)     NOT NULL,
    identity       VARCHAR(255) NOT NULL,
    action         VARCHAR(32)  NOT NULL,
    object_type    VARCHAR(16),
    entity_set     VARCHAR(32),
    entity_id      TEXT COLLATE "C",
    authsource_id  VARCHAR(255) COLLATE "C",
    document       TEXT,
    snapshot_from  INTEGER,
    snapshot_to    INTEGER,
    comment        TEXT,
    schema_version INTEGER
);

-- 8
CREATE INDEX console_audit_entity ON console_audit (entity_set, entity_id);

-- 9
CREATE INDEX console_audit_authsource ON console_audit (authsource_id);
