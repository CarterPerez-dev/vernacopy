"""
©AngelaMos | 2026
download_models.py
"""

import sys


def download_wordnet() -> None:
    print("--- WordNet (Open English WordNet 2025) ---")
    try:
        import wn

        existing = wn.lexicons()
        oewn_installed = any("oewn" in lex.id() for lex in existing)

        if oewn_installed:
            print("  Already installed, skipping")
            return

        print("  Downloading oewn:2025 ...")
        wn.download("oewn:2025")
        print("  WordNet download complete")
    except Exception as exc:
        print(f"  ERROR downloading WordNet: {exc}")
        sys.exit(1)


def download_fasttext() -> None:
    print("\n--- fastText (wiki-news-subwords-300) ---")
    try:
        import gensim.downloader as api
        from pathlib import Path

        model_name = "fasttext-wiki-news-subwords-300"
        model_dir = Path(api.BASE_DIR) / model_name
        model_file = model_dir / f"{model_name}.gz"

        if model_file.exists():
            print("  Already downloaded, skipping")
            return

        print(f"  Downloading {model_name} (this may take a while) ...")
        api.load(model_name)
        print("  fastText download complete")
    except Exception as exc:
        print(f"  ERROR downloading fastText: {exc}")
        sys.exit(1)


def main() -> None:
    print("=" * 60)
    print("VernaCopy — NLP Model Downloader")
    print("=" * 60)

    download_wordnet()
    download_fasttext()

    print("\n" + "=" * 60)
    print("ALL MODELS READY")
    print("=" * 60)


if __name__ == "__main__":
    main()
