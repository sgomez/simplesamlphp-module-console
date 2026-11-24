<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Domain\Identity;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;
use SimpleSAML\Session;
use SimpleSAML\Utils\Auth;

final class AdminAccess
{
    private const array AUTHORITIES = ['admin', 'login-admin'];


    public function __construct(
        private readonly Session $session,
        private readonly Auth $auth = new Auth(),
    ) {
    }


    public function requireAdmin(): void
    {
        $this->auth->requireAdmin();
    }


    public function isAdmin(): bool
    {
        return $this->auth->isAdmin();
    }


    public function identity(): string
    {
        return Identity::resolve(ModuleConfig::userIdAttribute(), $this->attributes());
    }


    public function logoutUrl(?string $returnTo = null): string
    {
        return $this->auth->getAdminLogoutURL($returnTo);
    }


    /**
     * @return array<array-key, mixed>
     */
    private function attributes(): array
    {
        foreach (self::AUTHORITIES as $authority) {
            if ($this->session->isValid($authority)) {
                $attributes = $this->session->getAuthData($authority, 'Attributes');

                return is_array($attributes) ? $attributes : [];
            }
        }

        return [];
    }
}
