<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

/**
 * The risks of a service provider that never block (SPEC.md 5.9), as far as they can be judged from the document.
 */
final class SpRemoteWarnings
{
    public function __construct(private readonly int $expiryDays)
    {
    }


    /**
     * @param array<string, mixed> $document
     * @return list<\SimpleSAML\Module\console\Domain\Entity\Warning>
     */
    public function of(string $entityId, array $document, \DateTimeImmutable $now): array
    {
        return array_values(array_filter([
            ...(new CertificateExpiry($this->expiryDays))->warnings($document, $now),
            $this->sha1($document),
            $this->signingOff($document),
            $this->http($document),
            $this->unusable($document),
            $this->uri($entityId),
            isset($document['extra']) ? new Warning(
                'Uses extra',
                'The entity uses extra, options the Console does not check.',
            ) : null,
        ]));
    }


    /**
     * @param array<string, mixed> $document
     */
    private function sha1(array $document): ?Warning
    {
        foreach (['signature.algorithm', 'metadata.sign.algorithm'] as $option) {
            $algorithm = $document[$option] ?? null;
            if (is_string($algorithm) && str_ends_with(strtolower($algorithm), 'sha1')) {
                return new Warning('SHA-1', "'$option' uses SHA-1.");
            }
        }

        return null;
    }


    /**
     * @param array<string, mixed> $document
     */
    private function signingOff(array $document): ?Warning
    {
        $off = array_filter(
            ['saml20.sign.response', 'saml20.sign.assertion', 'sign.authnrequest', 'sign.logout',
                'validate.authnrequest', 'validate.logout'],
            static fn (string $option): bool => ($document[$option] ?? null) === false,
        );

        return $off === [] ? null : new Warning(
            'Signing off',
            'Signing or signature checking is switched off: ' . implode(', ', $off) . '.',
        );
    }


    /**
     * @param array<string, mixed> $document
     */
    private function http(array $document): ?Warning
    {
        foreach (['AssertionConsumerService', 'SingleLogoutService', 'DiscoveryResponse'] as $service) {
            $urls = array_map(
                static fn (mixed $url): bool => is_string($url) && stripos($url, 'http://') === 0,
                self::locations((array) ($document[$service] ?? [])),
            );
            if (in_array(true, $urls, true)) {
                return new Warning('http endpoint', "An endpoint of $service uses http, not https.");
            }
        }

        return null;
    }


    /**
     * @param array<array-key, mixed> $endpoints
     * @return list<mixed>
     */
    private static function locations(array $endpoints): array
    {
        $urls = [];
        foreach ($endpoints as $endpoint) {
            $urls[] = ((array) $endpoint)['Location'] ?? null;
            $urls[] = ((array) $endpoint)['ResponseLocation'] ?? null;
        }

        return $urls;
    }


    /**
     * @param array<string, mixed> $document
     */
    private function unusable(array $document): ?Warning
    {
        $endpoints = (array) ($document['SingleLogoutService'] ?? []);
        if ($endpoints === []) {
            return null;
        }
        $usable = [
            'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        ];
        foreach ($endpoints as $endpoint) {
            if (in_array(((array) $endpoint)['Binding'] ?? null, $usable, true)) {
                return null;
            }
        }

        return new Warning(
            'Unusable endpoints',
            'None of the endpoints of SingleLogoutService has a binding core uses.',
        );
    }


    private function uri(string $entityId): ?Warning
    {
        return preg_match('/^[A-Za-z][A-Za-z0-9+.\-]*:./', $entityId) === 1
            ? null
            : new Warning('Entity ID not a URI', 'The entity ID is not an absolute URI.');
    }
}
