<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Config;

final readonly class DatabaseSettings
{
    public function __construct(
        public string $dsn,
        public ?string $username = null,
        public ?string $password = null,
        public string $prefix = '',
    ) {
        if (preg_match('/^[A-Za-z0-9_]*$/', $prefix) !== 1) {
            throw new \InvalidArgumentException('The database prefix may only hold letters, digits and underscores.');
        }
    }


    public function table(string $name): string
    {
        return $this->prefix . 'console_' . $name;
    }
}
