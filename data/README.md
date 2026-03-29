# Data Downloads for VernaCopy Clarity Pipeline

Academic psycholinguistic datasets must be downloaded manually (most require
acknowledging terms of use). Place every file in `data/raw/`.

---

## 1. SUBTLEX-US (Brysbaert & New, 2009)

Word frequencies based on American English subtitles (51 million words).

**Download:** <https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus>

Look for the Excel/CSV download labelled *SUBTLEX-US with Zipf values* or
the tab-separated text file.

**Expected file:** `data/raw/subtlex-us.csv`

**Key columns:** `Word` (the word), `SUBTLWF` (frequency per million),
`Lg10WF` (log10 frequency + 1). Alternate column names in some exports:
`Freq_pm`, `LogFreq`.

---

## 2. Age of Acquisition (Brysbaert & Kuperman, 2012)

Mean age-of-acquisition ratings for 30,000 English words.

**Download:** <https://link.springer.com/article/10.3758/s13428-012-0210-4>

Supplementary materials contain the CSV.

**Expected file:** `data/raw/aoa.csv`

**Key columns:** `Word`, `Rating.Mean` (mean AoA in years). Alternate
column name: `AoA_Kup_lem`.

---

## 3. Concreteness Ratings (Brysbaert et al., 2014)

Concreteness ratings for 40,000 English lemmas on a 1-5 scale.

**Download:** <https://link.springer.com/article/10.3758/s13428-013-0403-5>

Supplementary materials contain the CSV.

**Expected file:** `data/raw/concreteness.csv`

**Key columns:** `Word`, `Conc.M` (mean concreteness 1-5). Alternate
column name: `Conc.Mean`.

---

## 4. MRC Psycholinguistic Database

Familiarity ratings for English words on a 100-700 scale.

**Download:** <https://websites.psychology.uwa.edu.au/school/MRCDatabase/uwa_mrc.htm>

Export or download the full dataset as a text/CSV file.

**Expected file:** `data/raw/mrc.csv`

**Key columns:** `word` (or `WORD`), `fam` (or `FAM`) — familiarity score
100-700.

---

## 5. Moby Thesaurus (Project Gutenberg)

Public-domain thesaurus with 30,000 root words and synonyms.

**Download:** <https://www.gutenberg.org/files/3202/files/mthesaur.txt>

Save directly into `data/raw/`.

**Expected file:** `data/raw/mthesaur.txt`

**Format:** One entry per line. First word is the root, remaining
comma-separated words are synonyms.

---

## 6. Oxford 3000 / CEFR Word List (optional)

Maps common English words to CEFR proficiency levels (A1-C2).

Various community-maintained CSV versions are available online. Search for
"Oxford 3000 CEFR CSV" or "Oxford 5000 CSV".

**Expected file:** `data/raw/oxford_cefr.csv`

**Key columns:** `word`, `cefr` (level string like A1, A2, B1, B2, C1, C2).

---

## After downloading

Run the pipeline:

```bash
cd vernacopy
uv run python scripts/build_database.py --data-dir data/raw
uv run python scripts/seed_phrases.py
uv run python scripts/download_models.py
```
