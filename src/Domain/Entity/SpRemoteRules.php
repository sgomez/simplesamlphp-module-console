<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class SpRemoteRules
{
    public function __construct(private readonly ExtraRules $extra, private readonly RowRules $rows = new RowRules())
    {
    }


    /**
     * @param array<string, mixed> $document
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public function check(array $document): array
    {
        $errors = [];
        foreach (['AssertionConsumerService', 'SingleLogoutService', 'DiscoveryResponse'] as $service) {
            array_push($errors, ...$this->endpoints($service, (array) ($document[$service] ?? [])));
        }
        array_push($errors, ...$this->certificates((array) ($document['certificates'] ?? [])));

        array_push($errors, ...$this->rows->check($document), ...(new NotYetRules())->check($document));

        return [...$errors, ...$this->extra->check((array) ($document['extra'] ?? []))];
    }


    /**
     * @param array<array-key, mixed> $endpoints
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    private function endpoints(string $service, array $endpoints): array
    {
        $errors = [];
        $indexes = [];
        $default = false;
        foreach (array_values($endpoints) as $position => $endpoint) {
            $endpoint = (array) $endpoint;
            $at = '/' . $service . '/' . $position;
            if (isset($endpoint['index'])) {
                $repeated = in_array($endpoint['index'], $indexes, true);
                $indexes[] = $endpoint['index'];
                $repeated && $errors[] = new ValidationError($at . '/index', 'Two endpoints cannot share an index.');
            }
            if (($endpoint['isDefault'] ?? false) === true) {
                $default && $errors[] = new ValidationError($at . '/isDefault', 'Only one endpoint can be default.');
                $default = true;
            }
        }

        return $errors;
    }


    /**
     * @param array<array-key, mixed> $certificates
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    private function certificates(array $certificates): array
    {
        $errors = [];
        foreach (array_values($certificates) as $position => $certificate) {
            $pem = ((array) $certificate)['pem'] ?? null;
            if (!is_string($pem) || Pem::normalise($pem) === null) {
                $errors[] = new ValidationError(
                    '/certificates/' . $position . '/pem',
                    'The text is not one PEM-encoded X.509 certificate.',
                );
            }
        }

        return $errors;
    }
}
