"""
©AngelaMos | 2026
embed_words.py
"""

import argparse
import os
import sys
from pathlib import Path

import gensim.downloader as gensim_api
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


def get_database_url(cli_url: str | None) -> str:
    if cli_url:
        return cli_url
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url
    print("ERROR: --database-url required or DATABASE_URL env var not set")
    sys.exit(1)


def ensure_psycopg2_url(url: str) -> str:
    if "asyncpg" in url:
        return url.replace("postgresql+asyncpg", "postgresql+psycopg2")
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def main() -> None:
    parser = argparse.ArgumentParser(description="Embed words using fastText and store in DB")
    parser.add_argument("--database-url", type=str, default=None)
    parser.add_argument("--model", type=str, default="fasttext-wiki-news-subwords-300")
    parser.add_argument("--batch-size", type=int, default=500)
    args = parser.parse_args()

    env_paths = [
        Path(__file__).resolve().parent.parent / "vernacopy" / ".env.development",
        Path(__file__).resolve().parent.parent / ".env",
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            break

    db_url = ensure_psycopg2_url(get_database_url(args.database_url))
    engine = create_engine(db_url, echo=False)

    print("=" * 60)
    print("VernaCopy — Word Embedding Seeder")
    print("=" * 60)

    print(f"\nLoading fastText model: {args.model}")
    print("(This takes a few minutes on first run, subsequent runs use mmap)")
    model = gensim_api.load(args.model)
    print(f"Model loaded. Vocab size: {len(model)}")

    with engine.connect() as conn:
        rows = conn.execute(text("SELECT word FROM words ORDER BY word")).fetchall()

    words = [row[0] for row in rows]
    total = len(words)
    print(f"\nEmbedding {total} words in batches of {args.batch_size}...")

    found = 0
    skipped = 0

    for batch_start in range(0, total, args.batch_size):
        batch = words[batch_start:batch_start + args.batch_size]
        updates = []

        for word in batch:
            if word in model:
                vec = model[word].tolist()
                updates.append({"word": word, "embedding": str(vec)})
                found += 1
            else:
                try:
                    vec = model.get_vector(word).tolist()
                    updates.append({"word": word, "embedding": str(vec)})
                    found += 1
                except Exception:
                    skipped += 1

        if updates:
            with engine.begin() as conn:
                conn.execute(
                    text("UPDATE words SET embedding = CAST(:embedding AS vector) WHERE word = :word"),
                    updates
                )

        pct = (batch_start + len(batch)) / total * 100
        print(f"  {batch_start + len(batch):,}/{total:,} ({pct:.1f}%) — found: {found:,}, skipped: {skipped:,}", end="\r")

    print(f"\n\nDone!")
    print(f"  Embedded: {found:,}")
    print(f"  Skipped:  {skipped:,}")
    print("=" * 60)

    engine.dispose()


if __name__ == "__main__":
    main()
