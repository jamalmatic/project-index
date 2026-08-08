# PostgreSQL migrations

Migrations are ordered SQL files and are applied in filename order by the deployment/migration runner.

`001_initial_schema.sql` creates the persistence tables used by the current PostgreSQL adapter:

- `entities`
- `assertions`
- `relationships`
- `sources`
- `evidence`

The adapter currently stores the canonical immutable domain object in the `data` JSONB column. The relational IDs and timestamps provide stable persistence identity and operational metadata while preserving the domain representation without lossy mapping.

The migration is idempotent (`IF NOT EXISTS`) and executes as one transaction.
