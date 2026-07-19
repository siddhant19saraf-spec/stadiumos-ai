# Database Migration Runbook

## Purpose
This runbook covers the lifecycle of database migrations using Alembic — from creating a new migration, reviewing it, applying it to environments, handling data migrations, and rolling back when necessary.

---

## 1. Prerequisites

- Alembic installed (`pip install alembic`)
- `alembic.ini` configured with correct database URL
- `env.py` configured for the StadiumOS application models
- Database URL accessible from the migration environment

### Verify Alembic Configuration
```powershell
# Check current Alembic version
alembic --version

# List all known migrations
alembic history

# Show current revision of the connected database
alembic current
```

---

## 2. Creating a New Migration

### 2.1 Auto-Generate Migration (Recommended)
```powershell
# Auto-detect changes from SQLAlchemy models
alembic revision --autogenerate -m "Add events table"
```

This compares your SQLAlchemy model definitions against the current database schema and generates a migration script.

### 2.2 Manual Migration (Complex Changes)
```powershell
# Create an empty migration
alembic revision -m "Custom data migration for venue seats"
```

### 2.3 Migration File Location
All migration files are stored in `apps/api/alembic/versions/` with the naming pattern:
```
{revision_hash}_{description}.py
```

---

## 3. Migration File Structure

Every migration file must contain:

```python
"""Add events table

Revision ID: abc123def456
Revises: previous_hash
Create Date: 2026-07-18 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "abc123def456"
down_revision = "previous_hash"
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Schema changes go here
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(50), server_default="draft"),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_events_start_time", "events", ["start_time"])

def downgrade() -> None:
    # Reverse schema changes here
    op.drop_index("ix_events_start_time")
    op.drop_table("events")
```

### Rules for Migration Files
- **Every migration MUST have a `downgrade()` function** — even if it just logs "irreversible"
- Use `op.execute()` for raw SQL when Alembic operators are insufficient
- Avoid importing application models directly — use `op` and `sa` instead
- Test both `upgrade()` and `downgrade()` before committing

---

## 4. Reviewing a Migration

Before applying to production, review:

- [ ] Does `upgrade()` match the intended schema change?
- [ ] Does `downgrade()` correctly reverse the change?
- [ ] Are there any irreversible operations (e.g., `DROP COLUMN`) that would lose data?
- [ ] Are indexes/NOT NULL/foreign keys properly defined?
- [ ] Is the migration idempotent when possible?
- [ ] Does it handle existing data correctly (default values, backfills)?
- [ ] Performance: will this migration lock the table for too long?

### Common Pitfalls
| Issue | Description | Fix |
|-------|-------------|-----|
| Adding a NOT NULL column without default | Fails on existing rows with NULL | Add `server_default` or backfill first |
| Dropping a column that is still referenced in code | Production errors | Drop code reference first, then column in next release |
| Large table without batching | Locks table for minutes | Use batch operations or raw SQL with batching |
| Irreversible downgrade | Data is permanently lost | Add data preservation logic in downgrade |

---

## 5. Applying Migrations

### 5.1 Local Development
```powershell
# Apply all pending migrations
alembic upgrade head

# Verify
alembic current
```

### 5.2 Staging / CI
```powershell
# Run migrations as part of CI pipeline
alembic upgrade head
```

### 5.3 Production
```powershell
# Method 1: Via Cloud Run job
gcloud run jobs execute stadiumos-db-migrate --region us-central1

# Method 2: Direct connection (ensure VPN or authorized IP)
alembic upgrade head

# Method 3: Docker Compose (for self-hosted)
docker compose exec stadiumos-api alembic upgrade head
```

### 5.4 Apply a Specific Number of Migrations
```powershell
# Upgrade by 2 revisions
alembic upgrade +2
```

### 5.5 Apply to a Specific Revision
```powershell
alembic upgrade abc123def456
```

---

## 6. Rolling Back (Downgrade)

### 6.1 Downgrade by One Revision
```powershell
alembic downgrade -1
```

### 6.2 Downgrade to a Specific Revision
```powershell
alembic downgrade abc123def456
```

### 6.3 Downgrade All the Way
```powershell
alembic downgrade base
```

### 6.4 Force Stamp (if automatic detection fails)
```powershell
# If migration state is inconsistent, force-stamp to a known revision
alembic stamp abc123def456
```

**Warning**: Downgrading a migration may cause **data loss**. Always:
1. Take a full database backup before downgrading
2. Understand what data was added during the forward migration
3. Communicate the downgrade with the team

---

## 7. Data Migration Patterns

### 7.1 Simple Data Migration (in migration file)
```python
def upgrade() -> None:
    # Schema change
    op.add_column("users", sa.Column("full_name", sa.String(255)))

    # Data migration — populate new column from existing data
    op.execute("""
        UPDATE users SET full_name = first_name || ' ' || last_name
        WHERE full_name IS NULL
    """)
```

### 7.2 Batch Data Migration (large tables)
```python
def upgrade() -> None:
    # Add column with nullable first
    op.add_column("events", sa.Column("slug", sa.String(255)))

    # Batch update to avoid long table locks
    connection = op.get_bind()
    total = connection.execute(
        sa.text("SELECT COUNT(*) FROM events WHERE slug IS NULL")
    ).scalar()

    batch_size = 1000
    for offset in range(0, total, batch_size):
        connection.execute(
            sa.text("""
                UPDATE events
                SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || id
                WHERE slug IS NULL
                ORDER BY id
                LIMIT :limit OFFSET :offset
            """),
            {"limit": batch_size, "offset": offset},
        )
```

### 7.3 Separate Data Migration Script
For complex data migrations, create a standalone script in `apps/api/scripts/`:

```python
# apps/api/scripts/backfill_slugs.py
"""One-time script to backfill event slugs."""
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.event import Event

async def main():
    async with AsyncSessionLocal() as session:
        events = await session.execute(
            sa.select(Event).where(Event.slug.is_(None))
        )
        for event in events.scalars():
            event.slug = f"{event.name.lower().replace(' ', '-')}-{event.id}"
        await session.commit()

asyncio.run(main())
```

Run with:
```powershell
cd apps/api
python -m scripts.backfill_slugs
```

---

## 8. Migration Workflow for a Release

```
1. Developer creates migration ────────> PR with migration file + model changes
2. Code review ──────────────────────> Check upgrade() + downgrade() + data implications
3. CI runs migrations on test DB ────> alembic upgrade head (must pass)
4. CI runs tests ────────────────────> pytest (must pass with new schema)
5. CI tests downgrade ───────────────> alembic downgrade -1 (must revert cleanly)
6. Staging deploy ───────────────────> migrations run automatically on deploy
7. Production deploy ────────────────> migrations run before app starts
8. Post-deploy verification ─────────> alembic current + data integrity checks
```

---

## 9. Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `Target database is not up to date` | Local DB is behind migration history | Run `alembic upgrade head` |
| `FAILED: Path doesn't intersect current revision` | Divergent migration branches | Use `alembic merge` or `alembic stamp` |
| `FAILED: Can't locate revision identified by ...` | Missing migration file | Check file exists in versions/; re-clone if needed |
| Migration runs but schema doesn't change | Alembic thinks no changes needed | Manually verify models; use `--autogenerate` with explicit model imports |
| Downgrade fails with FK constraint | Data added that violates constraints | Remove or update dependent data first |
| Migration takes too long on production | Table is very large | Use batch operations; consider `pt-online-schema-change` for MySQL equivalent |

---

## 10. Best Practices

- **One migration per logical change** — do not bundle unrelated schema changes
- **Always provide a downgrade** — even if it raises an `IrreversibleMigrationError` with explanation
- **Test both directions** — run `alembic upgrade head` then `alembic downgrade -1` in CI
- **Do not edit committed migration files** — create a new migration to fix issues
- **Run migrations before deploying new code** — the new code should work with both old and new schema
- **Never run `alembic stamp head` on production** unless you are absolutely sure the schema matches
- **Back up production before deploying migrations** — use `pg_dump` or Cloud SQL backup
