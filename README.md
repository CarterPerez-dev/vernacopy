```
▀████▀   ▀███▀
  ▀██     ▄█
   ██▄   ▄█    ▄▄█▀██▀███▄███▀████████▄  ▄█▀██▄  ▄██▀██  ▄██▀██▄▀████████▄▀██▀   ▀██▀
    ██▄  █▀   ▄█▀   ██ ██▀ ▀▀  ██    ██ ██   ██ ██▀  ██ ██▀   ▀██ ██   ▀██  ██   ▄█
    ▀██ █▀    ██▀▀▀▀▀▀ ██      ██    ██  ▄█████ ██      ██     ██ ██    ██   ██ ▄█
     ▄██▄     ██▄    ▄ ██      ██    ██ ██   ██ ██▄    ▄██▄   ▄██ ██   ▄██    ███
      ██       ▀█████▀████▄  ▄████  ████▄████▀██▄█████▀  ▀█████▀  ██████▀     ▄█
                                                                  ██        ▄█
                                                                ▄████▄    ██▀
```


[![Application](https://img.shields.io/badge/Vernacopy%20%231-orange?style=flat&logo=github)](https://github.com/CarterPerez-dev/vernacopy)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![License: AGPLv3](https://img.shields.io/badge/License-AGPL_v3-purple.svg)](https://www.gnu.org/licenses/agpl-3.0)

> Word clarity scoring for copywriters, marketers, and anyone who writes to be understood.
> 
<img width="1593" height="983" alt="vernacopy" src="https://github.com/user-attachments/assets/e3b9c576-dc49-4b12-853b-2c433a05ebe5" />

---

VernaCopy analyzes your copy word-by-word and scores it against psycholinguistic research — frequency, age-of-acquisition, concreteness, and familiarity data from real human processing studies. Not vibes. Not grammar rules. Actual data on how hard each word is for a human brain to process.

When a word scores low, VernaCopy suggests simpler alternatives that fit the sentence context — filtered by a local AI model and ranked by the same psycholinguistic data, so you're always swapping down in complexity, never sideways.

## What's in it

**Copy Scanner** — Paste any block of copy. Every content word gets a clarity tier (S → D) and a score. Low-scoring words are clickable with inline replacement suggestions. Rescan after edits to track your score improving.

**Word Lookup** — Look up any single word and see its full breakdown: frequency score, age-of-acquisition, concreteness, familiarity, CEFR level, and alternatives ranked by clarity.

**Word Compare** — Put two words side by side and see which one is clearer and by how much.

## How the scoring works

Each word is scored across four dimensions pulled from published psycholinguistic datasets:

- **Frequency** — how often the word appears per million words of spoken English (SUBTLEX-US)
- **Age of Acquisition** — the age at which most people learn the word
- **Concreteness** — how tangible vs. abstract the concept is
- **Familiarity** — how familiar the word feels to an average reader (MRC Psycholinguistic Database)

These are normalized and combined into a single clarity score. A word like *use* scores ~80. A word like *utilize* scores ~30.

## How alternatives are generated

When a word scores C or D tier, the tool runs a three-step pipeline to find better options:

1. **Synonym lookup** — WordNet (OEWN 2025) for strict synonyms + SimplePPDB for corpus-derived simplifications with directional simplification scores
2. **Semantic search** — pgvector finds the closest words in the scored vocabulary by embedding distance, filtered to only words that score higher than the original
3. **Context filter** — a local LLM (qwen2.5:3b via Ollama) checks which candidates actually fit the sentence without changing the meaning, and can suggest additional simpler alternatives

The psycholinguistic data has the final say — no suggestion makes it through unless it scores higher than the word it's replacing.

## Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy (async), Alembic |
| Database | PostgreSQL + pgvector, Redis |
| AI / NLP | Ollama (qwen2.5:3b), fastText embeddings, WordNet OEWN 2025, SimplePPDB |
| Frontend | React 19, TypeScript, Vite, Zustand, TanStack Query, SCSS Modules |
| Infra | Docker, nginx, JWT auth (access + refresh tokens) |

## License

AGPL 3.0
