#!/usr/bin/env python3
"""
Citability Scorer — scores content blocks for AI-citation readiness (0-100 per passage).

`score_passage()` is copied unchanged from zubair-trabzada/geo-seo-claude (MIT, see
LICENSE-geo-seo-claude). documently.in replaced the requests/BeautifulSoup fetcher with a
stdlib HTML parser so it runs on the static build (`out/**/index.html`) with no pip installs.

Usage:
  python3 citability_scorer.py out/compress-pdf/index.html          # one page, JSON
  python3 citability_scorer.py out --summary                       # every page, table
"""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional


def score_passage(text: str, heading: Optional[str] = None) -> dict:
    """Score a single passage for AI citability (0-100)."""
    words = text.split()
    word_count = len(words)

    scores = {
        "answer_block_quality": 0,
        "self_containment": 0,
        "structural_readability": 0,
        "statistical_density": 0,
        "uniqueness_signals": 0,
    }

    # === 1. Answer Block Quality (30%) ===
    abq_score = 0

    # Check for definition patterns ("X is...", "X refers to...", "X means...")
    definition_patterns = [
        r"\b\w+\s+is\s+(?:a|an|the)\s",
        r"\b\w+\s+refers?\s+to\s",
        r"\b\w+\s+means?\s",
        r"\b\w+\s+(?:can be |are )?defined\s+as\s",
        r"\bin\s+(?:simple|other)\s+(?:terms|words)\s*,",
    ]
    for pattern in definition_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            abq_score += 15
            break

    # Check if answer appears early (first 60 words)
    first_60_words = " ".join(words[:60])
    if any(
        re.search(p, first_60_words, re.IGNORECASE)
        for p in [
            r"\b(?:is|are|was|were|means?|refers?)\b",
            r"\d+%",
            r"\$[\d,]+",
            r"\d+\s+(?:million|billion|thousand)",
        ]
    ):
        abq_score += 15

    # Question-based heading bonus
    if heading and heading.endswith("?"):
        abq_score += 10

    # Clear, direct sentence structure
    sentences = re.split(r"[.!?]+", text)
    short_clear_sentences = sum(
        1 for s in sentences if 5 <= len(s.split()) <= 25
    )
    if sentences:
        clarity_ratio = short_clear_sentences / len(sentences)
        abq_score += int(clarity_ratio * 10)

    # Has specific, quotable claim
    if re.search(
        r"(?:according to|research shows|studies? (?:show|indicate|suggest|found)|data (?:shows|indicates|suggests))",
        text,
        re.IGNORECASE,
    ):
        abq_score += 10

    scores["answer_block_quality"] = min(abq_score, 30)

    # === 2. Self-Containment (25%) ===
    sc_score = 0

    # Optimal word count (134-167 words)
    if 134 <= word_count <= 167:
        sc_score += 10
    elif 100 <= word_count <= 200:
        sc_score += 7
    elif 80 <= word_count <= 250:
        sc_score += 4
    elif word_count < 30 or word_count > 400:
        sc_score += 0
    else:
        sc_score += 2

    # Low pronoun density (fewer pronouns = more self-contained)
    pronoun_count = len(
        re.findall(
            r"\b(?:it|they|them|their|this|that|these|those|he|she|his|her)\b",
            text,
            re.IGNORECASE,
        )
    )
    if word_count > 0:
        pronoun_ratio = pronoun_count / word_count
        if pronoun_ratio < 0.02:
            sc_score += 8
        elif pronoun_ratio < 0.04:
            sc_score += 5
        elif pronoun_ratio < 0.06:
            sc_score += 3

    # Contains named entities (proper nouns, brands, specific terms)
    proper_nouns = len(re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text))
    if proper_nouns >= 3:
        sc_score += 7
    elif proper_nouns >= 1:
        sc_score += 4

    scores["self_containment"] = min(sc_score, 25)

    # === 3. Structural Readability (20%) ===
    sr_score = 0

    # Sentence count and length distribution
    if sentences:
        avg_sentence_length = word_count / len(sentences)
        if 10 <= avg_sentence_length <= 20:
            sr_score += 8
        elif 8 <= avg_sentence_length <= 25:
            sr_score += 5
        else:
            sr_score += 2

    # Contains list-like structures
    if re.search(r"(?:first|second|third|finally|additionally|moreover|furthermore)", text, re.IGNORECASE):
        sr_score += 4

    # Contains numbered items or bullet-like content
    if re.search(r"(?:\d+[\.\)]\s|\b(?:step|tip|point)\s+\d+)", text, re.IGNORECASE):
        sr_score += 4

    # Paragraph breaks (indicates structure)
    if "\n" in text:
        sr_score += 4

    scores["structural_readability"] = min(sr_score, 20)

    # === 4. Statistical Density (15%) ===
    sd_score = 0

    # Percentages
    pct_count = len(re.findall(r"\d+(?:\.\d+)?%", text))
    sd_score += min(pct_count * 3, 6)

    # Dollar amounts
    dollar_count = len(re.findall(r"\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|M|B|K))?", text))
    sd_score += min(dollar_count * 3, 5)

    # Other numbers with context
    number_count = len(re.findall(r"\b\d+(?:,\d{3})*(?:\.\d+)?\s+(?:users|customers|pages|sites|companies|businesses|people|percent|times|x\b)", text, re.IGNORECASE))
    sd_score += min(number_count * 2, 4)

    # Year references (indicates timeliness)
    year_count = len(re.findall(r"\b20(?:2[3-6]|1\d)\b", text))
    if year_count > 0:
        sd_score += 2

    # Named sources
    source_patterns = [
        r"(?:according to|per|from|by)\s+[A-Z]",
        r"(?:Gartner|Forrester|McKinsey|Harvard|Stanford|MIT|Google|Microsoft|OpenAI|Anthropic)",
        r"\([A-Z][a-z]+(?:\s+\d{4})?\)",
    ]
    for pattern in source_patterns:
        if re.search(pattern, text):
            sd_score += 2

    scores["statistical_density"] = min(sd_score, 15)

    # === 5. Uniqueness Signals (10%) ===
    us_score = 0

    # Original data indicators
    if re.search(
        r"(?:our (?:research|study|data|analysis|survey|findings)|we (?:found|discovered|analyzed|surveyed|measured))",
        text,
        re.IGNORECASE,
    ):
        us_score += 5

    # Case study or example indicators
    if re.search(
        r"(?:case study|for example|for instance|in practice|real-world|hands-on)",
        text,
        re.IGNORECASE,
    ):
        us_score += 3

    # Specific tool/product mentions (shows practical experience)
    if re.search(r"(?:using|with|via|through)\s+[A-Z][a-z]+", text):
        us_score += 2

    scores["uniqueness_signals"] = min(us_score, 10)

    # === Calculate total ===
    total = sum(scores.values())

    # Determine grade
    if total >= 80:
        grade = "A"
        label = "Highly Citable"
    elif total >= 65:
        grade = "B"
        label = "Good Citability"
    elif total >= 50:
        grade = "C"
        label = "Moderate Citability"
    elif total >= 35:
        grade = "D"
        label = "Low Citability"
    else:
        grade = "F"
        label = "Poor Citability"

    return {
        "heading": heading,
        "word_count": word_count,
        "total_score": total,
        "grade": grade,
        "label": label,
        "breakdown": scores,
        "preview": " ".join(words[:30]) + ("..." if word_count > 30 else ""),
    }


SKIP = {"script", "style", "nav", "footer", "header", "aside", "form", "button", "label", "fieldset"}
BLOCK = {"h1", "h2", "h3", "h4", "p", "li", "td", "th", "summary", "caption"}


class _Blocks(HTMLParser):
    """Collects (tag, text) for headings and text blocks, skipping chrome and the tool UI."""

    def __init__(self):
        super().__init__()
        self.skip = 0
        self.stack: list[str] = []
        self.buf: list[str] = []
        self.out: list[tuple[str, str]] = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP:
            self.skip += 1
        elif tag in BLOCK and not self.skip:
            self.stack.append(tag)
            self.buf = []

    def handle_endtag(self, tag):
        if tag in SKIP and self.skip:
            self.skip -= 1
        elif tag in BLOCK and not self.skip and self.stack and self.stack[-1] == tag:
            self.stack.pop()
            text = re.sub(r"\s+", " ", "".join(self.buf)).strip()
            if text:
                self.out.append((tag, text))
            self.buf = []

    def handle_data(self, data):
        if not self.skip and self.stack:
            self.buf.append(data)


def extract_blocks(html: str) -> list[dict]:
    """Groups paragraphs/list items under their nearest heading, like the upstream extractor."""
    p = _Blocks()
    p.feed(html)
    blocks, heading, paras = [], "Introduction", []
    for tag, text in p.out:
        if tag in {"h1", "h2", "h3", "h4", "summary"}:
            if paras and len(" ".join(paras).split()) >= 20:
                blocks.append({"heading": heading, "content": " ".join(paras)})
            heading, paras = text, []
        elif len(text.split()) >= 5:
            paras.append(text)
    if paras and len(" ".join(paras).split()) >= 20:
        blocks.append({"heading": heading, "content": " ".join(paras)})
    return blocks


def analyze_html(html: str, source: str) -> dict:
    scored = [score_passage(b["content"], b["heading"]) for b in extract_blocks(html)]
    grades = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    for b in scored:
        grades[b["grade"]] += 1
    avg = sum(b["total_score"] for b in scored) / len(scored) if scored else 0
    return {
        "source": source,
        "total_blocks_analyzed": len(scored),
        "average_citability_score": round(avg, 1),
        "optimal_length_passages": sum(1 for b in scored if 134 <= b["word_count"] <= 167),
        "grade_distribution": grades,
        "top_5_citable": sorted(scored, key=lambda x: x["total_score"], reverse=True)[:5],
        "bottom_5_citable": sorted(scored, key=lambda x: x["total_score"])[:5],
    }


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 1
    target = Path(argv[0])
    if target.is_dir():
        pages = sorted(target.rglob("index.html"))
        pages = [p for p in pages if "/_next/" not in str(p) and "/admin/" not in str(p) and "__" not in str(p)]
        results = [analyze_html(p.read_text(encoding="utf-8"), str(p.relative_to(target).parent) or "/") for p in pages]
        if "--summary" in argv:
            results.sort(key=lambda r: r["average_citability_score"])
            print(f"{'page':48} {'avg':>5} {'blocks':>6} {'134-167w':>8}  A/B/C/D/F")
            for r in results:
                g = r["grade_distribution"]
                print(f"{r['source']:48} {r['average_citability_score']:5} {r['total_blocks_analyzed']:6} {r['optimal_length_passages']:8}  "
                      f"{g['A']}/{g['B']}/{g['C']}/{g['D']}/{g['F']}")
            site = sum(r["average_citability_score"] for r in results) / len(results) if results else 0
            print(f"\nsite average: {site:.1f} across {len(results)} pages")
        else:
            print(json.dumps(results, indent=2))
        return 0
    print(json.dumps(analyze_html(target.read_text(encoding="utf-8"), str(target)), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
