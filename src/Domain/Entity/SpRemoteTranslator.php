<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class SpRemoteTranslator
{
    /**
     * The array core receives for a document, in the order of the document.
     *
     * @param array<string, mixed> $document
     * @return array<array-key, mixed>
     */
    public function translate(array $document): array
    {
        $core = [];
        $extra = [];
        foreach ($document as $option => $value) {
            if ($option === 'extra') {
                $extra = (array) $value;
                continue;
            }
            [$name, $translated] = $this->option($option, $value);
            $core[$name] = $translated;
        }

        return $core + $extra;
    }


    /**
     * @return array{string, mixed}
     */
    private function option(string $option, mixed $value): array
    {
        return match ($option) {
            'certificates' => ['keys', $this->keys((array) $value)],
            'contacts' => [$option, $this->contacts((array) $value)],
            'EntityAttributes' => [$option, $this->entityAttributes((array) $value)],
            'RegistrationInfo' => [$option, $this->registration((array) $value)],
            default => [$option, $value],
        };
    }


    /**
     * @param array<array-key, mixed> $certificates
     * @return list<array<string, mixed>>
     */
    private function keys(array $certificates): array
    {
        $uses = ['signing' => [true, false], 'encryption' => [false, true], 'both' => [true, true]];
        $keys = [];
        foreach ($certificates as $certificate) {
            $certificate = (array) $certificate;
            $use = $certificate['use'] ?? null;
            $pem = $certificate['pem'] ?? null;
            [$signing, $encryption] = $uses[is_string($use) ? $use : ''] ?? [true, true];
            $keys[] = [
                'type' => 'X509Certificate',
                'signing' => $signing,
                'encryption' => $encryption,
                'X509Certificate' => Pem::body(is_string($pem) ? $pem : ''),
            ];
        }

        return $keys;
    }


    /**
     * @param array<array-key, mixed> $contacts
     * @return list<array<array-key, mixed>>
     */
    private function contacts(array $contacts): array
    {
        return array_map(function (mixed $contact): array {
            $contact = (array) $contact;
            if (isset($contact['attributes'])) {
                $contact['attributes'] = $this->map((array) $contact['attributes'], 'name', 'value');
            }

            return $contact;
        }, array_values($contacts));
    }


    /**
     * @param array<array-key, mixed> $rows
     * @return array<string, mixed>
     */
    private function entityAttributes(array $rows): array
    {
        return $this->map($rows, 'name', 'values');
    }


    /**
     * @param array<array-key, mixed> $info
     * @return array<array-key, mixed>
     */
    private function registration(array $info): array
    {
        if (isset($info['instant'])) {
            $instant = $info['instant'];
            $info['instant'] = (new \DateTimeImmutable(is_string($instant) ? $instant : ''))->getTimestamp();
        }

        return $info;
    }


    /**
     * @param array<array-key, mixed> $rows
     * @return array<string, mixed>
     */
    private function map(array $rows, string $key, string $value): array
    {
        $map = [];
        foreach ($rows as $row) {
            $row = (array) $row;
            $name = $row[$key] ?? '';
            $map[is_string($name) ? $name : ''] = $row[$value] ?? null;
        }

        return $map;
    }
}
