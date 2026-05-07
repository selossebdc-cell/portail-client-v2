#!/usr/bin/env python3
"""
Génère paires HTML + PDF lisibles pour le portail FSY à partir d'un transcript
UTF-8 (.txt) ou d'un fichier RTF (via textutil sur macOS).

Usage:
  python3 scripts/render_fsy_transcript_artifacts.py --txt SRC --basename fsy-cr-2026-03-02 --out-dir clients/fsy/pdfs
  python3 scripts/render_fsy_transcript_artifacts.py --rtf SRC.rtf --basename fsy-cr-2026-03-02 --out-dir clients/fsy/pdfs
"""
from __future__ import annotations

import argparse
import html
import pathlib
import subprocess
import sys
import textwrap

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def rtf_to_plain(rtf_path: pathlib.Path) -> str:
    try:
        out = subprocess.run(
            ["textutil", "-convert", "txt", "-stdout", str(rtf_path)],
            check=True,
            capture_output=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        raise SystemExit(f"textutil RTF→txt a échoué ({e})") from e
    return out.stdout.decode("utf-8", errors="replace")


def load_text(path: pathlib.Path, from_rtf: bool) -> str:
    if from_rtf:
        return rtf_to_plain(path)
    return path.read_text(encoding="utf-8", errors="replace")


def write_html(text: str, out: pathlib.Path, title: str) -> None:
    escaped = html.escape(text)
    pre = (
        "<pre style=\"white-space:pre-wrap;word-wrap:break-word;"
        "font-family:system-ui,-apple-system,'Segoe UI',sans-serif;"
        "font-size:15px;line-height:1.55;padding:28px;max-width:52rem;"
        "margin:0 auto;background:#141414;color:#eaeaea;border-radius:10px;"
        "border:1px solid #2a2a2a\">"
        f"{escaped}</pre>"
    )
    doc = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{html.escape(title)}</title>
</head>
<body style="margin:0;padding:20px;background:#0a0a0a;">
{pre}
</body>
</html>
"""
    out.write_text(doc, encoding="utf-8")


def write_pdf_text(text: str, out: pathlib.Path, title: str) -> None:
    page_w, page_h = A4
    margin_x = 42
    margin_top = page_h - 48
    margin_bottom = 48
    line_height = 11
    font_size = 8.5
    max_chars = 105

    c = canvas.Canvas(str(out), pagesize=A4)
    c.setAuthor("CS Consulting Stratégique")
    c.setTitle(title[:200])

    def new_page():
        c.showPage()
        c.setFont("Courier", font_size)
        return margin_top

    y = margin_top
    c.setFont("Courier", font_size)

    for raw_line in text.splitlines():
        line = raw_line.rstrip() if raw_line.strip() else ""
        if not line:
            y -= line_height
            if y < margin_bottom:
                y = new_page()
            continue
        for chunk in textwrap.wrap(
            line,
            max_chars,
            break_long_words=True,
            break_on_hyphens=False,
        ) or [""]:
            c.drawString(margin_x, y, chunk)
            y -= line_height
            if y < margin_bottom:
                y = new_page()
    c.save()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--txt", type=pathlib.Path, help="Fichier transcript .txt")
    ap.add_argument("--rtf", type=pathlib.Path, help="Fichier RTF (textutil)")
    ap.add_argument("--out-dir", type=pathlib.Path, required=True)
    ap.add_argument("--basename", required=True, help="Sans extension (ex. fsy-cr-2026-03-02)")
    ap.add_argument("--title", default="", help="Titre PDF/HTML (défaut = basename)")
    args = ap.parse_args()

    if bool(args.txt) == bool(args.rtf):
        ap.error("Préciser exactement l’un des drapeaux --txt ou --rtf")

    src = args.txt if args.txt else args.rtf
    if not src.is_file():
        sys.exit(f"Source introuvable : {src}")

    text = load_text(src, from_rtf=bool(args.rtf))
    if not text.strip():
        sys.exit(f"Contenu vide après lecture : {src}")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    title = args.title or args.basename.replace("-", " ")
    base = args.out_dir / args.basename
    html_path = base.with_suffix(".html")
    pdf_path = base.with_suffix(".pdf")

    write_html(text, html_path, title)
    write_pdf_text(text, pdf_path, title)
    print(f"OK {html_path} ({html_path.stat().st_size} o)")
    print(f"OK {pdf_path} ({pdf_path.stat().st_size} o)")


if __name__ == "__main__":
    main()
