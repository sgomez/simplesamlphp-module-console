# Security policy

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Do not open public issues for security bugs.

Reports reach the sole maintainer. There is no service level: acknowledgement is best effort, indicatively within 7 days, with no committed time to a fix.

## Disclosure

Disclosure is coordinated, with a cap of 90 days from the report. The advisory is published together with the release that fixes it; at 90 days without a fix it is published anyway, with the known mitigations.

## Supported versions

Only the latest released minor receives security fixes. There are no backports. Before 1.0, only the latest release does.

## Out of scope

- Flaws in SimpleSAMLphp core or in other modules: report them to their own channels.
- Secrets stored in clear in the database and in the Snapshot, a documented decision ([ADR 0001](docs/adr/0001-no-application-level-encryption-of-secrets.md)).
- The administrator seeing a secret in the edit form of the object that holds it.

Reporters are credited in the advisory. There are no bounties.
