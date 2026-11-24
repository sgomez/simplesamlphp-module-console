<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M004CreatePointer
{
    private const string PGSQL = <<<'SQL'
        CREATE TABLE console_pointer (
            id             SMALLINT NOT NULL PRIMARY KEY CHECK (id = 1),
            current_number INTEGER,
            last_number    INTEGER  NOT NULL DEFAULT 0
        )
        SQL;

    private const string MYSQL = <<<'SQL'
        CREATE TABLE console_pointer (
            id             SMALLINT NOT NULL PRIMARY KEY CHECK (id = 1),
            current_number INT,
            last_number    INT      NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        SQL;

    private const string SQLITE = <<<'SQL'
        CREATE TABLE console_pointer (
            id             SMALLINT NOT NULL PRIMARY KEY CHECK (id = 1),
            current_number INTEGER,
            last_number    INTEGER  NOT NULL DEFAULT 0
        )
        SQL;


    public static function define(): Migration
    {
        return new Migration(
            4,
            ['pgsql' => self::PGSQL, 'mysql' => self::MYSQL, 'sqlite' => self::SQLITE],
        );
    }
}
