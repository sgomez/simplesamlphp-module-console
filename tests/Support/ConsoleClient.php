<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Configuration;
use SimpleSAML\Module;
use SimpleSAML\Session;
use SimpleSAML\XHTML\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class ConsoleClient
{
    private const int KNOWN_SCHEMA = 9;


    /** @var array<string, mixed> */
    private array $moduleConfig = [];


    public function __construct()
    {
        $_SERVER['REQUEST_URI'] = '/simplesaml/module.php/console/';
        $_SERVER['HTTP_HOST'] = 'localhost';
        $_SERVER['SERVER_NAME'] = 'localhost';
        $_SERVER['SERVER_PORT'] = 80;
        Configuration::clearInternalState();
        (new \ReflectionProperty(Session::class, 'instance'))->setValue(null, null);
        Session::useTransientSession();
        $this->withDatabase(range(1, self::KNOWN_SCHEMA));
    }


    /**
     * A SQLite database holding the given migration numbers; null leaves it without a versions table.
     *
     * @param list<int>|null $applied
     */
    public function withDatabase(?array $applied): self
    {
        $file = (string) getenv('CONSOLE_TEST_DIR') . '/db-' . bin2hex(random_bytes(6)) . '.sqlite';
        $pdo = new \PDO('sqlite:' . $file);
        if ($applied !== null) {
            $pdo->exec(
                'CREATE TABLE console_schema_version (version INTEGER NOT NULL PRIMARY KEY, applied_at CHAR(20))',
            );
            foreach ($applied as $number) {
                $pdo->exec("INSERT INTO console_schema_version VALUES ($number, '2026-11-24T10:15:00Z')");
            }
        }

        return $this->withModuleConfig(['database' => ['dsn' => 'sqlite:' . $file]]);
    }


    public function withUnreachableDatabase(): self
    {
        return $this->withModuleConfig(['database' => ['dsn' => 'sqlite:/nonexistent-dir/console.sqlite']]);
    }


    /**
     * @param array<string, list<string>> $attributes
     */
    public function loginAsAdmin(array $attributes = []): self
    {
        $authData = new \ReflectionProperty(Session::class, 'authData');
        $authData->setValue(Session::getSessionFromRequest(), [
            'admin' => ['Authority' => 'admin', 'Attributes' => $attributes, 'Expire' => time() + 3600],
        ]);

        return $this;
    }


    /**
     * @param array<string, mixed> $moduleConfig
     */
    public function withModuleConfig(array $moduleConfig): self
    {
        $this->moduleConfig = array_merge($this->moduleConfig, $moduleConfig);
        Configuration::setPreLoadedConfig(Configuration::loadFromArray($this->moduleConfig), 'module_console.php');

        return $this;
    }


    public function get(string $path): Response
    {
        $route = rtrim('/console' . $path, '/');
        $request = Request::create('/module.php' . $route);
        $request->server->set('PATH_INFO', $route);
        $request->server->set('SCRIPT_FILENAME', '/var/www/simplesaml/public/module.php');
        $_SERVER = array_merge($_SERVER, $request->server->all());
        $_SERVER['REQUEST_URI'] = '/simplesaml/module.php' . $route . '/';
        $handler = self::exceptionHandler();
        $response = Module::process($request);
        for ($i = 0; $i < 5 && self::exceptionHandler() !== $handler; $i++) {
            restore_exception_handler();
        }
        $this->applySecurityHeaders($response);

        return $response;
    }


    private static function exceptionHandler(): ?callable
    {
        $handler = set_exception_handler(null);
        restore_exception_handler();

        return $handler;
    }


    public function page(string $path = '/'): string
    {
        return self::body($this->get($path));
    }


    public static function body(Response $response): string
    {
        return $response instanceof Template ? $response->getContents() : (string) $response->getContent();
    }


    private function applySecurityHeaders(Response $response): void
    {
        $headers = Configuration::getInstance()
            ->getOptionalArray('headers.security', Configuration::DEFAULT_SECURITY_HEADERS);
        foreach ($headers as $name => $value) {
            if (!$response->headers->has($name)) {
                $response->headers->set($name, $value);
            }
        }
    }
}
