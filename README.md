# SimpleSAMLphp Console (`sgomez/simplesamlphp-module-console`)

Web administration console for **SimpleSAMLphp 2.x** to manage SAML entities and authentication sources backed by a relational database instead of flat PHP files.


## Install

```bash
composer require sgomez/simplesamlphp-module-console
```

Enable the module in `config/config.php` (`'module.enable' => ['console' => true]`), then open the **Console** link on the Configuration tab of the SimpleSAMLphp admin interface. See `SPEC.md` for the full installation steps.

## Development

```bash
composer install
git config core.hooksPath .githooks   # rebuild public/assets/app on commits that touch the front end
composer test       # Pest suite
composer static     # PHPStan, PHP_CodeSniffer, file size
composer coverage   # line coverage, at least 90 %
composer mutate     # mutation score on src/Domain, at least 85 %
composer build      # build the front end into public/assets/app/ (committed)
composer dev        # local environment with the Vite development server
npm run lint        # ESLint
npm run typecheck   # tsc
npm test            # Vitest with coverage
```
