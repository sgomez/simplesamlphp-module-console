<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M002CreateAuthsource
{
    private const string PGSQL = <<<'SQL'
        CREATE TABLE console_authsource (
            id         VARCHAR(255) COLLATE "C" NOT NULL PRIMARY KEY,
            type       VARCHAR(64)              NOT NULL,
            enabled    SMALLINT                 NOT NULL,
            document   TEXT                     NOT NULL,
            version    INTEGER                  NOT NULL,
            created_at CHAR(20)                 NOT NULL,
            updated_at CHAR(20)                 NOT NULL
        )
        SQL;

    private const string MYSQL = <<<'SQL'
        CREATE TABLE console_authsource (
            id         VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
            type       VARCHAR(64)  NOT NULL,
            enabled    TINYINT      NOT NULL,
            document   LONGTEXT     NOT NULL,
            version    INT          NOT NULL,
            created_at CHAR(20)     NOT NULL,
            updated_at CHAR(20)     NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        SQL;

    private const string SQLITE = <<<'SQL'
        CREATE TABLE console_authsource (
            id         TEXT        NOT NULL PRIMARY KEY,
            type       VARCHAR(64) NOT NULL,
            enabled    INTEGER     NOT NULL,
            document   TEXT        NOT NULL,
            version    INTEGER     NOT NULL,
            created_at CHAR(20)    NOT NULL,
            updated_at CHAR(20)    NOT NULL
        )
        SQL;


    public static function define(): Migration
    {
        return new Migration(
            2,
            ['pgsql' => self::PGSQL, 'mysql' => self::MYSQL, 'sqlite' => self::SQLITE],
        );
    }
}
