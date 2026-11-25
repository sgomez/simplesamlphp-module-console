<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module;
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


    /**
     * The sidebar's identity, its links to core's admin pages and logout, which returns to the Console.
     *
     * @return array{
     *     identity: string,
     *     core: array{configuration: string, test: string, federation: string},
     *     logoutUrl: string,
     * }
     */
    public function links(): array
    {
        return [
            'identity' => $this->identity(),
            'core' => [
                'configuration' => Module::getModuleURL('admin/'),
                'test' => Module::getModuleURL('admin/test'),
                'federation' => Module::getModuleURL('admin/federation'),
            ],
            'logoutUrl' => $this->auth->getAdminLogoutURL(Module::getModuleURL('console/')),
        ];
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
