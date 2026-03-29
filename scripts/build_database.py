"""
©AngelaMos | 2026
build_database.py
"""

import argparse
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


def resolve_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for name in candidates:
        if name in df.columns:
            return name
    return None


def load_subtlex(path: Path) -> pd.DataFrame | None:
    candidates = list(path.parent.glob("subtlex*"))
    if not candidates:
        return None

    fpath = candidates[0]
    print(f"  Loading SUBTLEX-US from {fpath.name}")

    sep = "\t" if fpath.suffix in (".tsv", ".txt") else ","
    df = pd.read_csv(fpath, sep=sep, encoding="latin-1", low_memory=False)

    word_col = resolve_column(df, ["Word", "word", "WORD"])
    freq_col = resolve_column(df, ["SUBTLWF", "Freq_pm", "FREQcount", "SUBTL_WF"])
    log_col = resolve_column(df, ["Lg10WF", "LogFreq", "Log10WF", "Lg10WF"])

    if word_col is None or freq_col is None:
        print("  WARNING: could not find expected columns in SUBTLEX file")
        print(f"  Available columns: {list(df.columns)}")
        return None

    result = pd.DataFrame({"word": df[word_col].astype(str).str.lower().str.strip()})
    result["subtlex_freq_per_million"] = pd.to_numeric(df[freq_col], errors="coerce")

    if log_col:
        result["subtlex_log_freq"] = pd.to_numeric(df[log_col], errors="coerce")
    else:
        result["subtlex_log_freq"] = np.log10(result["subtlex_freq_per_million"].clip(lower=0.001) + 1)

    result = result.dropna(subset=["word"])
    result = result[result["word"].str.len() > 0]
    result = result.drop_duplicates(subset=["word"], keep="first")
    print(f"  Loaded {len(result):,} words from SUBTLEX-US")
    return result


def load_aoa(path: Path) -> pd.DataFrame | None:
    candidates = list(path.parent.glob("aoa*"))
    if not candidates:
        return None

    fpath = candidates[0]
    print(f"  Loading AoA from {fpath.name}")

    sep = "\t" if fpath.suffix in (".tsv", ".txt") else ","
    df = pd.read_csv(fpath, sep=sep, encoding="latin-1", low_memory=False)

    word_col = resolve_column(df, ["Word", "word", "WORD"])
    rating_col = resolve_column(df, ["Rating.Mean", "AoA_Kup_lem", "AoA_Mean", "Rating_Mean"])

    if word_col is None or rating_col is None:
        print("  WARNING: could not find expected columns in AoA file")
        print(f"  Available columns: {list(df.columns)}")
        return None

    result = pd.DataFrame({"word": df[word_col].astype(str).str.lower().str.strip()})
    result["aoa"] = pd.to_numeric(df[rating_col], errors="coerce")

    result = result.dropna(subset=["word", "aoa"])
    result = result[result["word"].str.len() > 0]
    result = result.drop_duplicates(subset=["word"], keep="first")
    print(f"  Loaded {len(result):,} words from AoA")
    return result


def load_concreteness(path: Path) -> pd.DataFrame | None:
    candidates = list(path.parent.glob("concreteness*")) + list(path.parent.glob("concrete*"))
    seen = set()
    unique = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    candidates = unique

    if not candidates:
        return None

    fpath = candidates[0]
    print(f"  Loading Concreteness from {fpath.name}")

    sep = "\t" if fpath.suffix in (".tsv", ".txt") else ","
    df = pd.read_csv(fpath, sep=sep, encoding="latin-1", low_memory=False)

    word_col = resolve_column(df, ["Word", "word", "WORD"])
    conc_col = resolve_column(df, ["Conc.M", "Conc.Mean", "Conc_M", "ConcM"])

    if word_col is None or conc_col is None:
        print("  WARNING: could not find expected columns in Concreteness file")
        print(f"  Available columns: {list(df.columns)}")
        return None

    result = pd.DataFrame({"word": df[word_col].astype(str).str.lower().str.strip()})
    result["concreteness"] = pd.to_numeric(df[conc_col], errors="coerce")

    result = result.dropna(subset=["word", "concreteness"])
    result = result[result["word"].str.len() > 0]
    result = result.drop_duplicates(subset=["word"], keep="first")
    print(f"  Loaded {len(result):,} words from Concreteness")
    return result


def load_mrc(path: Path) -> pd.DataFrame | None:
    candidates = list(path.parent.glob("mrc*"))
    if not candidates:
        return None

    fpath = candidates[0]
    print(f"  Loading MRC from {fpath.name}")

    sep = "\t" if fpath.suffix in (".tsv", ".txt") else ","
    df = pd.read_csv(fpath, sep=sep, encoding="latin-1", low_memory=False)

    word_col = resolve_column(df, ["word", "WORD", "Word"])
    fam_col = resolve_column(df, ["fam", "FAM", "Fam", "familiarity"])

    if word_col is None or fam_col is None:
        print("  WARNING: could not find expected columns in MRC file")
        print(f"  Available columns: {list(df.columns)}")
        return None

    result = pd.DataFrame({"word": df[word_col].astype(str).str.lower().str.strip()})
    result["mrc_familiarity"] = pd.to_numeric(df[fam_col], errors="coerce")

    result = result[result["mrc_familiarity"] > 0]
    result = result.dropna(subset=["word", "mrc_familiarity"])
    result = result[result["word"].str.len() > 0]
    result = result.drop_duplicates(subset=["word"], keep="first")
    print(f"  Loaded {len(result):,} words from MRC")
    return result


def load_cefr(path: Path) -> pd.DataFrame | None:
    candidates = list(path.parent.glob("oxford*")) + list(path.parent.glob("cefr*"))
    if not candidates:
        return None

    fpath = candidates[0]
    print(f"  Loading CEFR from {fpath.name}")

    sep = "\t" if fpath.suffix in (".tsv", ".txt") else ","
    df = pd.read_csv(fpath, sep=sep, encoding="latin-1", low_memory=False)

    word_col = resolve_column(df, ["word", "Word", "WORD"])
    cefr_col = resolve_column(df, ["cefr", "CEFR", "level", "Level"])

    if word_col is None or cefr_col is None:
        print("  WARNING: could not find expected columns in CEFR file")
        print(f"  Available columns: {list(df.columns)}")
        return None

    result = pd.DataFrame({"word": df[word_col].astype(str).str.lower().str.strip()})
    result["cefr_level"] = df[cefr_col].astype(str).str.strip().str.upper()

    result = result.dropna(subset=["word"])
    result = result[result["word"].str.len() > 0]
    result = result.drop_duplicates(subset=["word"], keep="first")
    print(f"  Loaded {len(result):,} words from CEFR")
    return result


def normalize_column(series: pd.Series, invert: bool = False) -> pd.Series:
    cap = series.quantile(0.99)
    floor = series.quantile(0.01)
    clamped = series.clip(lower=floor, upper=cap)

    min_val = clamped.min()
    max_val = clamped.max()

    if max_val == min_val:
        return pd.Series(0.5, index=series.index)

    normalized = (clamped - min_val) / (max_val - min_val)

    if invert:
        normalized = 1.0 - normalized

    return normalized


def compute_clarity(df: pd.DataFrame) -> pd.DataFrame:
    print("\n--- Normalizing dimensions ---")

    freq_median = df["subtlex_freq_per_million"].median()
    aoa_median = df["aoa"].median()
    conc_median = df["concreteness"].median()
    fam_median = df["mrc_familiarity"].median()

    print(f"  Median imputation values: freq={freq_median:.2f}, aoa={aoa_median:.2f}, "
          f"conc={conc_median:.2f}, fam={fam_median:.2f}")

    df["subtlex_freq_per_million"] = df["subtlex_freq_per_million"].fillna(freq_median)
    df["aoa"] = df["aoa"].fillna(aoa_median)
    df["concreteness"] = df["concreteness"].fillna(conc_median)
    df["mrc_familiarity"] = df["mrc_familiarity"].fillna(fam_median)

    freq_norm = normalize_column(df["subtlex_freq_per_million"])
    aoa_inv_norm = normalize_column(df["aoa"], invert=True)
    conc_norm = normalize_column(df["concreteness"])
    fam_norm = normalize_column(df["mrc_familiarity"])

    df["clarity_score"] = (
        freq_norm * 0.30
        + aoa_inv_norm * 0.30
        + conc_norm * 0.20
        + fam_norm * 0.20
    ) * 100

    df["clarity_score"] = df["clarity_score"].round(2)

    def assign_tier(score: float) -> str:
        if score >= 90:
            return "S"
        if score >= 75:
            return "A"
        if score >= 60:
            return "B"
        if score >= 40:
            return "C"
        return "D"

    df["tier"] = df["clarity_score"].apply(assign_tier)

    tier_counts = df["tier"].value_counts().sort_index()
    print("\n--- Tier distribution ---")
    for tier_label, count in tier_counts.items():
        print(f"  {tier_label}: {count:,}")

    return df


def insert_words(engine, df: pd.DataFrame) -> None:
    print(f"\n--- Inserting {len(df):,} words into database ---")

    upsert_sql = text("""
        INSERT INTO words (
            word, subtlex_freq_per_million, subtlex_log_freq,
            aoa, concreteness, mrc_familiarity,
            cefr_level, clarity_score, tier
        ) VALUES (
            :word, :subtlex_freq_per_million, :subtlex_log_freq,
            :aoa, :concreteness, :mrc_familiarity,
            :cefr_level, :clarity_score, :tier
        )
        ON CONFLICT (word) DO UPDATE SET
            subtlex_freq_per_million = EXCLUDED.subtlex_freq_per_million,
            subtlex_log_freq = EXCLUDED.subtlex_log_freq,
            aoa = EXCLUDED.aoa,
            concreteness = EXCLUDED.concreteness,
            mrc_familiarity = EXCLUDED.mrc_familiarity,
            cefr_level = EXCLUDED.cefr_level,
            clarity_score = EXCLUDED.clarity_score,
            tier = EXCLUDED.tier
    """)

    records = df.replace({np.nan: None}).to_dict("records")

    batch_size = 5000
    with engine.begin() as conn:
        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]
            conn.execute(upsert_sql, batch)
            print(f"  Inserted batch {i // batch_size + 1} ({len(batch)} rows)")

    print("  Words insert complete")


def load_moby_thesaurus(path: Path) -> list[dict]:
    candidates = list(path.parent.glob("mthesaur*"))
    if not candidates:
        print("  Moby Thesaurus file not found, skipping")
        return []

    fpath = candidates[0]
    print(f"\n--- Loading Moby Thesaurus from {fpath.name} ---")

    entries = []
    with open(fpath, encoding="latin-1") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(",")
            if len(parts) < 2:
                continue
            root = parts[0].strip().lower()
            synonyms = [s.strip().lower() for s in parts[1:] if s.strip()]
            if root and synonyms:
                entries.append({"word": root, "synonyms": synonyms})

    print(f"  Parsed {len(entries):,} thesaurus entries")
    return entries


def insert_moby(engine, entries: list[dict]) -> None:
    if not entries:
        return

    print(f"  Inserting {len(entries):,} synonym entries into database")

    upsert_sql = text("""
        INSERT INTO moby_synonyms (word, synonyms)
        VALUES (:word, :synonyms)
        ON CONFLICT (word) DO UPDATE SET
            synonyms = EXCLUDED.synonyms
    """)

    batch_size = 5000
    with engine.begin() as conn:
        for i in range(0, len(entries), batch_size):
            batch = entries[i : i + batch_size]
            conn.execute(upsert_sql, batch)
            print(f"  Inserted batch {i // batch_size + 1} ({len(batch)} rows)")

    print("  Moby synonyms insert complete")


def get_database_url(args_url: str | None) -> str:
    if args_url:
        return args_url

    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url

    print("ERROR: no database URL provided.")
    print("  Use --database-url or set DATABASE_URL in environment / .env")
    sys.exit(1)


def ensure_psycopg2_url(url: str) -> str:
    if "asyncpg" in url:
        return url.replace("postgresql+asyncpg", "postgresql+psycopg2")
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def main() -> None:
    parser = argparse.ArgumentParser(description="Build VernaCopy word clarity database")
    parser.add_argument(
        "--data-dir",
        type=str,
        default="data/raw",
        help="Directory containing downloaded CSV files",
    )
    parser.add_argument(
        "--database-url",
        type=str,
        default=None,
        help="PostgreSQL connection URL (overrides DATABASE_URL env var)",
    )
    args = parser.parse_args()

    env_paths = [
        Path(__file__).resolve().parent.parent / "vernacopy" / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent / ".env",
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            break

    data_dir = Path(args.data_dir).resolve()
    if not data_dir.exists():
        print(f"ERROR: data directory not found: {data_dir}")
        sys.exit(1)

    db_url = get_database_url(args.database_url)
    db_url = ensure_psycopg2_url(db_url)

    print("=" * 60)
    print("VernaCopy — Word Clarity Database Builder")
    print("=" * 60)
    print(f"Data directory : {data_dir}")
    print(f"Database       : {db_url.split('@')[-1] if '@' in db_url else '(local)'}")
    print()

    engine = create_engine(db_url, echo=False)

    print("--- Loading datasets ---")
    subtlex_df = load_subtlex(data_dir / "subtlex")
    aoa_df = load_aoa(data_dir / "aoa")
    conc_df = load_concreteness(data_dir / "concreteness")
    mrc_df = load_mrc(data_dir / "mrc")
    cefr_df = load_cefr(data_dir / "oxford")

    loaded = [d for d in [subtlex_df, aoa_df, conc_df, mrc_df] if d is not None]
    if not loaded:
        print("\nERROR: no datasets loaded. Place CSV files in the data directory.")
        print("See data/README.md for download instructions.")
        sys.exit(1)

    print(f"\n--- Merging {len(loaded)} datasets ---")
    merged = loaded[0]
    for other in loaded[1:]:
        merged = merged.merge(other, on="word", how="outer")

    if cefr_df is not None:
        merged = merged.merge(cefr_df, on="word", how="left")
    else:
        merged["cefr_level"] = None

    for col in ["subtlex_freq_per_million", "subtlex_log_freq", "aoa", "concreteness", "mrc_familiarity"]:
        if col not in merged.columns:
            merged[col] = np.nan

    merged = merged[merged["word"].str.match(r"^[a-z]", na=False)]
    merged = merged.drop_duplicates(subset=["word"], keep="first")
    print(f"  Merged dataset: {len(merged):,} unique words")

    merged = compute_clarity(merged)

    insert_words(engine, merged)

    moby_entries = load_moby_thesaurus(data_dir / "mthesaur")
    insert_moby(engine, moby_entries)

    print("\n" + "=" * 60)
    print("BUILD COMPLETE")
    print(f"  Total words   : {len(merged):,}")
    print(f"  Mean clarity  : {merged['clarity_score'].mean():.1f}")
    print(f"  Median clarity: {merged['clarity_score'].median():.1f}")
    print("=" * 60)

    engine.dispose()


if __name__ == "__main__":
    main()
