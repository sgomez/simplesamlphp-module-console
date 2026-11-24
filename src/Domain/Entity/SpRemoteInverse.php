<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class SpRemoteInverse
{
    public function __construct(
        private readonly SchemaCatalog $catalog,
        private readonly InverseCertificates $certificates,
    ) {
    }


    /**
     * @param array<array-key, mixed> $options
     */
    public function convert(array $options): InverseResult
    {
        $cataloged = $this->catalog->options(SpRemote::SET);
        $read = $this->certificates->convert($options);
        $named = array_filter(
            $options,
            static fn (mixed $value, int|string $key): bool => $value !== []
                && !in_array((string) $key, InverseCertificates::options(), true),
            ARRAY_FILTER_USE_BOTH,
        );
        $known = array_intersect_key($named, array_flip([...$cataloged, 'key_name', 'privatekey', 'privatekey_pass']));
        $extra = array_diff_key($named, $known);
        [$document, $unavailable] = $this->known($known);
        $read->certificates === [] || $document['certificates'] = $read->certificates;
        $extra === [] || $document['extra'] = $extra;
        $sources = ($read->source === null ? [] : ['certificates' => $read->source])
            + ($extra === [] ? [] : ['extra' => (string) array_key_first($extra)]);
        $moved = array_map(
            fn (int|string $name): Notice => $this->uncataloged((string) $name, $cataloged),
            array_keys($extra),
        );

        return new InverseResult(
            array_filter($document, static fn (mixed $value): bool => $value !== []),
            $sources,
            $read->errors,
            [...$read->notices, ...$moved],
            $unavailable,
        );
    }


    /**
     * @param array<array-key, mixed> $known
     * @return array{array<string, mixed>, list<string>}
     */
    private function known(array $known): array
    {
        $document = [];
        $unavailable = [];
        foreach ($known as $name => $value) {
            $converted = $this->option((string) $name, $value);
            $converted === null ? $unavailable[] = (string) $name : $document[(string) $name] = $converted[0];
        }

        return [$document, $unavailable];
    }


    /**
     * @return array{mixed}|null null when the Console does not take the option yet
     */
    private function option(string $name, mixed $value): ?array
    {
        return match ($name) {
            'AssertionConsumerService', 'SingleLogoutService' => [InverseForms::endpoints($name, $value)],
            'DiscoveryResponse', 'hide.from.discovery' => [$value],
            'name', 'description', 'OrganizationName', 'OrganizationDisplayName', 'OrganizationURL'
                => [InverseForms::language($value)],
            'scope' => [InverseForms::stringList($value)],
            'UIInfo' => [InverseForms::uiInfo($value)],
            'contacts' => [InverseForms::contacts($value)],
            'EntityAttributes' => [InverseForms::entityAttributes($value)],
            'RegistrationInfo' => [InverseForms::registration($value)],
            default => null,
        };
    }


    /**
     * @param list<string> $cataloged
     */
    private function uncataloged(string $name, array $cataloged): Notice
    {
        $closest = null;
        $best = 3;
        foreach ($cataloged as $option) {
            $distance = levenshtein(strtolower($name), strtolower($option));
            if ($distance < $best) {
                [$best, $closest] = [$distance, $option];
            }
        }
        $message = "'$name' is not a cataloged option; it was kept in extra.";

        return new Notice($message . ($closest === null ? '' : " Did you mean '$closest'?"), $name);
    }
}
