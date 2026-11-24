<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M007CreateAudit
{
    private const string PGSQL = <<<'SQL'
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
        )
        SQL;

    private const string MYSQL = <<<'SQL'
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        SQL;

    private const string SQLITE = <<<'SQL'
        CREATE TABLE console_audit (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            at             CHAR(20)     NOT NULL,
            identity       VARCHAR(255) NOT NULL,
            action         VARCHAR(32)  NOT NULL,
            object_type    VARCHAR(16),
            entity_set     TEXT,
            entity_id      TEXT,
            authsource_id  TEXT,
            document       TEXT,
            snapshot_from  INTEGER,
            snapshot_to    INTEGER,
            comment        TEXT,
            schema_version INTEGER
        )
        SQL;


    public static function define(): Migration
    {
        return new Migration(
            7,
            ['pgsql' => self::PGSQL, 'mysql' => self::MYSQL, 'sqlite' => self::SQLITE],
        );
    }
}
