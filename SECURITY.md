# Security policy

## Reporting a vulnerability

Report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/sgomez/simplesamlphp-module-console/security/advisories/new). There is no contact email.

Do not open a public issue for a security problem.

Reports reach the sole maintainer. There is no SLA: acknowledgement is best effort, indicatively within 7 days, with no committed time to a fix.

## Disclosure

- Disclosure is coordinated, capped at 90 days from the report.
- The advisory is published together with the release that fixes it. At 90 days without a fix, it is published anyway with the known mitigations.
- Fixes are prepared in the advisory's temporary private fork.
- Every confirmed vulnerability is published as a GitHub Security Advisory. A CVE is requested for medium severity or above.
- Reporters are credited. There are no bounties.

## Supported versions

Only the latest released minor receives security fixes. There are no backports. Before 1.0, only the latest release does.

## Out of scope

- Flaws in SimpleSAMLphp core or in other modules: report them to their own channels.
- Secrets stored in clear in the database and in the Snapshot, a documented decision ([ADR 0001](docs/adr/0001-no-application-level-encryption-of-secrets.md)).
- The administrator seeing a secret in the edit form of the object that holds it.
