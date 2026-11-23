# Timestamps stored as UTC text

Every timestamp the Console stores is a fixed-width ISO-8601 string in UTC (`2026-11-24T10:15:00Z`, `CHAR(20)`), on the three engines. Native types behave differently on each: PostgreSQL `timestamptz` converts to the session zone, MariaDB `TIMESTAMP` does the same and ends in 2038, and SQLite has no date type at all. With hand-written SQL per engine and no abstraction layer, one representation that sorts correctly as text and reads the same in any client removes a class of per-engine bugs.

## Considered Options

- **Native types per engine**: rejected for the reasons above.
- **Unix epoch in a `BIGINT`**: rejected; equally portable but unreadable when inspecting the database by hand.

## Consequences

- No date arithmetic in SQL. Thresholds ("not checked for 5 minutes", "silent for an hour") are computed in PHP and compared as strings.
- Resolution is one second. Ordering inside the Audit trail relies on its auto-increment id, never on the timestamp.
