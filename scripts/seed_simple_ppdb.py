"""
©AngelaMos | 2026
seed_simple_ppdb.py
"""

import argparse
import gzip
import os
import sys
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


MIN_PARAPHRASE_SCORE = 3.5
MIN_SIMPLIFICATION_SCORE = 0.7


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
    parser = argparse.ArgumentParser(description="Seed SimplePPDB into the database")
    parser.add_argument("--database-url", type=str, default=None)
    parser.add_argument(
        "--ppdb-path",
        type=str,
        default=str(
            Path(__file__).resolve().parent.parent
            / "data"
            / "raw"
            / "SimplePPDB"
            / "SimplePPDB.gz"
        ),
    )
    parser.add_argument("--batch-size", type=int, default=1000)
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
    ppdb_path = Path(args.ppdb_path)

    if not ppdb_path.exists():
        print(f"ERROR: SimplePPDB file not found at {ppdb_path}")
        sys.exit(1)

    print("=" * 60)
    print("VernaCopy — SimplePPDB Seeder")
    print("=" * 60)

    engine = create_engine(db_url)

    print("\nLoading vocabulary from words table...")
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT word FROM words")).fetchall()
    vocab: set[str] = {row[0].lower() for row in rows}
    print(f"  Vocabulary: {len(vocab):,} words")

    print(f"\nParsing {ppdb_path.name}...")
    print(f"  Filters: paraphrase_score >= {MIN_PARAPHRASE_SCORE}, "
          f"simplification_score >= {MIN_SIMPLIFICATION_SCORE}")

    word_to_simpler: dict[str, list[str]] = defaultdict(list)
    seen_pairs: set[tuple[str, str]] = set()
    total_lines = 0
    kept = 0
    skipped_phrase = 0
    skipped_score = 0
    skipped_vocab = 0

    with gzip.open(ppdb_path, "rt", encoding="utf-8") as f:
        for line in f:
            total_lines += 1
            parts = line.rstrip("\n").split("\t")
            if len(parts) != 5:
                continue

            paraphrase_score = float(parts[0])
            simplification_score = float(parts[1])
            input_word = parts[3].strip().lower()
            output_word = parts[4].strip().lower()

            if " " in input_word or " " in output_word:
                skipped_phrase += 1
                continue

            if paraphrase_score < MIN_PARAPHRASE_SCORE or simplification_score < MIN_SIMPLIFICATION_SCORE:
                skipped_score += 1
                continue

            if output_word not in vocab:
                skipped_vocab += 1
                continue

            if input_word == output_word:
                continue

            pair = (input_word, output_word)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            word_to_simpler[input_word].append(output_word)
            kept += 1

            if total_lines % 500_000 == 0:
                print(f"  {total_lines:,} lines processed...")

    print(f"\nResults:")
    print(f"  Total lines:       {total_lines:,}")
    print(f"  Skipped (phrase):  {skipped_phrase:,}")
    print(f"  Skipped (score):   {skipped_score:,}")
    print(f"  Skipped (vocab):   {skipped_vocab:,}")
    print(f"  Kept pairs:        {kept:,}")
    print(f"  Unique input words: {len(word_to_simpler):,}")

    print(f"\nUpserting into simple_ppdb in batches of {args.batch_size}...")

    entries = list(word_to_simpler.items())
    total_batches = (len(entries) + args.batch_size - 1) // args.batch_size

    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE simple_ppdb"))

        for i in range(0, len(entries), args.batch_size):
            batch = entries[i : i + args.batch_size]
            conn.execute(
                text(
                    "INSERT INTO simple_ppdb (word, simpler_words) "
                    "VALUES (:word, :simpler_words) "
                    "ON CONFLICT (word) DO UPDATE SET simpler_words = EXCLUDED.simpler_words"
                ),
                [
                    {"word": word, "simpler_words": simpler}
                    for word, simpler in batch
                ],
            )
            batch_num = i // args.batch_size + 1
            print(f"  Batch {batch_num}/{total_batches} done", end="\r")

    print(f"\n\nDone! {len(word_to_simpler):,} words seeded into simple_ppdb.")
    print("=" * 60)


if __name__ == "__main__":
    main()
