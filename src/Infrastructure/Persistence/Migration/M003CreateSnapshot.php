<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M003CreateSnapshot
{
    private const string PGSQL = <<<'SQL'
        CREATE TABLE console_snapshot (
            number         INTEGER      NOT NULL PRIMARY KEY,
            format_version INTEGER      NOT NULL,
            checksum       CHAR(64)     NOT NULL,
            document       TEXT         NOT NULL,
            comment        TEXT,
            created_at     CHAR(20)     NOT NULL,
            created_by     VARCHAR(255) NOT NULL
        )
        SQL;

    private const string MYSQL = <<<'SQL'
        CREATE TABLE console_snapshot (
            number         INT          NOT NULL PRIMARY KEY,
            format_version INT          NOT NULL,
            checksum       CHAR(64)     NOT NULL,
            document       LONGTEXT     NOT NULL,
            comment        TEXT,
            created_at     CHAR(20)     NOT NULL,
            created_by     VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        SQL;

    private const string SQLITE = <<<'SQL'
        CREATE TABLE console_snapshot (
            number         INTEGER      NOT NULL PRIMARY KEY,
            format_version INTEGER      NOT NULL,
            checksum       CHAR(64)     NOT NULL,
            document       TEXT         NOT NULL,
            comment        TEXT,
            created_at     CHAR(20)     NOT NULL,
            created_by     VARCHAR(255) NOT NULL
        )
        SQL;


    public static function define(): Migration
    {
        return new Migration(
            3,
            ['pgsql' => self::PGSQL, 'mysql' => self::MYSQL, 'sqlite' => self::SQLITE],
        );
    }
}
