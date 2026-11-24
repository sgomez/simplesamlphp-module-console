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
    public const string BASE = 'http://localhost/simplesaml/module.php/console';


    private array $moduleConfig = [];

    private string $databaseFile = '';


    public function __construct()
    {
        $_SERVER['REQUEST_URI'] = '/simplesaml/module.php/console/';
        $_SERVER['HTTP_HOST'] = 'localhost';
        $_SERVER['SERVER_NAME'] = 'localhost';
        $_SERVER['SERVER_PORT'] = 80;
        Configuration::clearInternalState();
        (new \ReflectionProperty(Session::class, 'instance'))->setValue(null, null);
        Session::useTransientSession();
        $this->moduleConfig = ['snapshot_dir' => BuildFixtures::dir()];
        $this->withMigratedDatabase();
    }


    public function snapshotDir(): string
    {
        return (string) $this->moduleConfig['snapshot_dir'];
    }


    public function withMigratedDatabase(): self
    {
        $this->databaseFile = ConsoleDatabase::migrated();

        return $this->withModuleConfig(['database' => ['dsn' => 'sqlite:' . $this->databaseFile]]);
    }


    /**
     * A SQLite database holding the given migration numbers; null leaves it without a versions table.
     *
     * @param list<int>|null $applied
     */
    public function withDatabase(?array $applied): self
    {
        $file = ConsoleDatabase::create($applied);
        $this->databaseFile = $file;

        return $this->withModuleConfig(['database' => ['dsn' => 'sqlite:' . $file]]);
    }


    public function database(): \PDO
    {
        return ConsoleDatabase::open($this->databaseFile);
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
        return $this->send('GET', $path, []);
    }


    public function post(string $path, array $data = []): Response
    {
        return $this->send('POST', $path, $data);
    }


    public function api(string $method, string $path, array $server = [], ?string $content = null): Response
    {
        return $this->send($method, '/api' . $path, [], $server, $content);
    }


    public static function tokenIn(string $html): string
    {
        preg_match('/name="_token" value="([0-9a-f]+)"/', $html, $matches);

        return $matches[1] ?? '';
    }


    private function send(string $method, string $path, array $data, array $server = [], ?string $body = null): Response
    {
        [$path, $query] = explode('?', $path, 2) + [1 => ''];
        $route = rtrim('/console' . $path, '/');
        $uri = '/module.php' . $route . ($query === '' ? '' : '?' . $query);
        $request = Request::create($uri, $method, $data, [], [], $server, $body);
        $request->server->set('PATH_INFO', $route);
        $request->server->set('SCRIPT_FILENAME', '/var/www/simplesaml/public/module.php');
        $_SERVER = array_merge($_SERVER, $request->server->all());
        $_SERVER['REQUEST_URI'] = '/simplesaml/module.php' . $route . '/';
        $handler = self::exceptionHandler();
        try {
            $response = Module::process($request);
        } finally {
            for ($i = 0; $i < 5 && self::exceptionHandler() !== $handler; $i++) {
                restore_exception_handler();
            }
        }
        SecurityHeaders::apply($response);

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
        return self::body(Redirects::follow($this, $this->get($path)));
    }


    public static function body(Response $response): string
    {
        return $response instanceof Template ? $response->getContents() : (string) $response->getContent();
    }
}
