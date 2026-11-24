<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

/**
 * Core's forms of an option, turned into the single form of the document. A value of a shape core does not
 * accept goes through unchanged, for the schema to report.
 */
final class InverseForms
{
    public static function language(mixed $value): mixed
    {
        return is_string($value) ? ['en' => $value] : $value;
    }


    public static function stringList(mixed $value): mixed
    {
        return is_string($value) ? [$value] : $value;
    }


    public static function endpoints(string $service, mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }

        $default = [
            'AssertionConsumerService' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            'SingleLogoutService' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ][$service] ?? null;

        return array_map(static function (mixed $endpoint) use ($default): mixed {
            return is_array($endpoint) && !isset($endpoint['Binding']) && $default !== null
                ? ['Binding' => $default] + $endpoint
                : $endpoint;
        }, array_values($value));
    }


    public static function uiInfo(mixed $value): mixed
    {
        return is_array($value) ? array_filter($value, static fn (mixed $member): bool => $member !== []) : $value;
    }


    public static function contacts(mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }

        return array_map(static function (mixed $contact): mixed {
            if (!is_array($contact)) {
                return $contact;
            }
            foreach (['emailAddress', 'telephoneNumber'] as $option) {
                isset($contact[$option]) && $contact[$option] = self::stringList($contact[$option]);
            }
            isset($contact['attributes']) && is_array($contact['attributes'])
                && $contact['attributes'] = self::rows($contact['attributes'], 'name', 'value', false);

            return array_filter($contact, static fn (mixed $v): bool => $v !== []);
        }, array_values($value));
    }


    public static function entityAttributes(mixed $value): mixed
    {
        return is_array($value) ? self::rows($value, 'name', 'values', true) : $value;
    }


    public static function registration(mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }
        isset($value['instant']) && is_int($value['instant'])
            && $value['instant'] = gmdate('Y-m-d\TH:i:s\Z', $value['instant']);

        return array_filter($value, static fn (mixed $v): bool => $v !== []);
    }


    /**
     * @param array<array-key, mixed> $map
     * @return list<array<string, mixed>>
     */
    private static function rows(array $map, string $key, string $value, bool $list): array
    {
        $rows = [];
        foreach ($map as $name => $item) {
            $rows[] = [$key => (string) $name, $value => $list ? self::stringList($item) : $item];
        }

        return $rows;
    }
}
