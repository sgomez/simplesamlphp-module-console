<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M001CreateEntity
{
    private const string PGSQL = <<<'SQL'
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
        )
        SQL;

    private const string MYSQL = <<<'SQL'
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        SQL;

    private const string SQLITE = <<<'SQL'
        CREATE TABLE console_entity (
            entity_set           TEXT     NOT NULL,
            entity_id            TEXT     NOT NULL,
            enabled              INTEGER  NOT NULL,
            document             TEXT     NOT NULL,
            version              INTEGER  NOT NULL,
            external_fingerprint CHAR(64),
            created_at           CHAR(20) NOT NULL,
            updated_at           CHAR(20) NOT NULL,
            PRIMARY KEY (entity_set, entity_id)
        )
        SQL;


    public static function define(): Migration
    {
        return new Migration(
            1,
            ['pgsql' => self::PGSQL, 'mysql' => self::MYSQL, 'sqlite' => self::SQLITE],
        );
    }
}
