"""
©AngelaMos | 2026
20260328_200000_add_word_embeddings.py
"""

from alembic import op

revision = '20260328_200000'
down_revision = '817ad3ceb9ef'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("ALTER TABLE words ADD COLUMN IF NOT EXISTS embedding vector(300)")
    op.execute("CREATE INDEX IF NOT EXISTS words_embedding_idx ON words USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS words_embedding_idx")
    op.execute("ALTER TABLE words DROP COLUMN IF EXISTS embedding")
