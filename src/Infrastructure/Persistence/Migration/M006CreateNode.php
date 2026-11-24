<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M006CreateNode
{
    private const string PGSQL = <<<'SQL'
        CREATE TABLE console_node (
            identifier    VARCHAR(255) NOT NULL PRIMARY KEY,
            served_number INTEGER,
            checked_at    CHAR(20)     NOT NULL,
            has_problems  SMALLINT     NOT NULL DEFAULT 0
        )
        SQL;

    private const string MYSQL = <<<'SQL'
        CREATE TABLE console_node (
            identifier    VARCHAR(255) NOT NULL PRIMARY KEY,
            served_number INT,
            checked_at    CHAR(20)     NOT NULL,
            has_problems  TINYINT      NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        SQL;

    private const string SQLITE = <<<'SQL'
        CREATE TABLE console_node (
            identifier    VARCHAR(255) NOT NULL PRIMARY KEY,
            served_number INTEGER,
            checked_at    CHAR(20)     NOT NULL,
            has_problems  INTEGER      NOT NULL DEFAULT 0
        )
        SQL;


    public static function define(): Migration
    {
        return new Migration(
            6,
            ['pgsql' => self::PGSQL, 'mysql' => self::MYSQL, 'sqlite' => self::SQLITE],
        );
    }
}
