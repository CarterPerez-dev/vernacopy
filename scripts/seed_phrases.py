"""
©AngelaMos | 2026
seed_phrases.py
"""

import os
import sys
from pathlib import Path

import uuid6
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


PHRASE_PAIRS: list[tuple[str, str]] = [
    ("in order to", "to"),
    ("at this point in time", "now"),
    ("in the event that", "if"),
    ("due to the fact that", "because"),
    ("on a daily basis", "daily"),
    ("in the near future", "soon"),
    ("a large number of", "many"),
    ("for the purpose of", "to"),
    ("with regard to", "about"),
    ("take into consideration", "consider"),
    ("make a decision", "decide"),
    ("is able to", "can"),
    ("has the ability to", "can"),
    ("in a timely manner", "quickly"),
    ("at the end of the day", "ultimately"),
    ("circle back", "follow up"),
    ("touch base", "connect"),
    ("low-hanging fruit", "easy wins"),
    ("deep dive", "thorough review"),
    ("level set", "align"),
    ("bandwidth", "capacity"),
    ("synergize", "combine"),
    ("ideate", "brainstorm"),
    ("incentivize", "motivate"),
    ("operationalize", "implement"),
    ("paradigm shift", "major change"),
    ("value proposition", "benefit"),
    ("pain point", "problem"),
    ("action items", "tasks"),
    ("best practices", "proven methods"),
    ("core competency", "strength"),
    ("deliverables", "what you get"),
    ("end-to-end", "complete"),
    ("holistic approach", "full picture"),
    ("key takeaways", "main points"),
    ("mission-critical", "essential"),
    ("scalable solution", "flexible approach"),
    ("streamline", "simplify"),
    ("in spite of the fact that", "although"),
    ("in the process of", "while"),
    ("in reference to", "about"),
    ("in accordance with", "by"),
    ("in conjunction with", "with"),
    ("come to a conclusion", "conclude"),
    ("give consideration to", "consider"),
    ("conduct an investigation", "investigate"),
    ("on a going-forward basis", "from now on"),
    ("move the needle", "make progress"),
    ("hard stop", "deadline"),
]


def get_database_url() -> str:
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url

    print("ERROR: DATABASE_URL not set in environment or .env")
    sys.exit(1)


def ensure_psycopg2_url(url: str) -> str:
    if "asyncpg" in url:
        return url.replace("postgresql+asyncpg", "postgresql+psycopg2")
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def main() -> None:
    env_paths = [
        Path(__file__).resolve().parent.parent / "vernacopy" / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent / ".env",
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            break

    db_url = ensure_psycopg2_url(get_database_url())
    engine = create_engine(db_url, echo=False)

    print("=" * 60)
    print("VernaCopy — Phrase Map Seeder")
    print("=" * 60)

    insert_sql = text("""
        INSERT INTO phrase_map (id, phrase, replacement, created_at)
        VALUES (:id, :phrase, :replacement, NOW())
        ON CONFLICT (phrase) DO NOTHING
    """)

    records = [
        {"id": str(uuid6.uuid7()), "phrase": phrase, "replacement": replacement}
        for phrase, replacement in PHRASE_PAIRS
    ]

    with engine.begin() as conn:
        result = conn.execute(insert_sql, records)
        print(f"  Inserted {result.rowcount} phrase mappings ({len(records)} attempted)")

    print("\n--- Updating clarity scores from words table ---")

    update_sql = text("""
        UPDATE phrase_map
        SET clarity_score = w.clarity_score,
            updated_at = NOW()
        FROM words w
        WHERE phrase_map.replacement = w.word
          AND w.clarity_score IS NOT NULL
          AND (phrase_map.clarity_score IS NULL
               OR phrase_map.clarity_score != w.clarity_score)
    """)

    with engine.begin() as conn:
        result = conn.execute(update_sql)
        print(f"  Updated {result.rowcount} phrase clarity scores")

    with engine.connect() as conn:
        row = conn.execute(text("SELECT COUNT(*) FROM phrase_map")).scalar()
        scored = conn.execute(
            text("SELECT COUNT(*) FROM phrase_map WHERE clarity_score IS NOT NULL")
        ).scalar()

    print(f"\n  Total phrases : {row}")
    print(f"  With scores   : {scored}")
    print("=" * 60)

    engine.dispose()


if __name__ == "__main__":
    main()
