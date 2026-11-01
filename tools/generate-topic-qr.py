"""Regenerate the static print artwork for Acropolis topic links; no network.

Run from any directory with Node, Python 3, ReportLab and Pillow:
    python tools/generate-topic-qr.py
Use --check to compare the QR artwork with the expected result without writing.
The checked-in artwork was generated with ReportLab 4.4.9 and Pillow 12.3.0.
These are maintainer tools only: the website does not run Python or call a QR service.
Keep old destinations working after renaming or reclassifying a topic.
"""
import argparse
import json
import subprocess
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw
from reportlab.graphics.barcode import qrencoder


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://" + (ROOT / "CNAME").read_text(encoding="utf-8").strip() + "/topics/"
OUTPUT = ROOT / "assets" / "qr"
BORDER = 4  # Quiet zone on every side, part of both saved files
SCALE = 24  # Integer PNG pixels per QR module


def artwork(url):
    code = qrencoder.QRCode(None, qrencoder.QRErrorCorrectLevel.Q)
    code.addData(qrencoder.QR8bitByte(url))
    code.make()
    n = code.getModuleCount()
    side = n + 2 * BORDER
    raster = Image.new("1", (side, side), 1)
    draw = ImageDraw.Draw(raster)
    paths = []
    for row in range(n):
        x = 0
        while x < n:
            if not code.isDark(row, x):
                x += 1
                continue
            start = x
            while x < n and code.isDark(row, x):
                x += 1
            # A horizontal run has the same bounds in SVG units and source pixels.
            y, left, run = row + BORDER, start + BORDER, x - start
            draw.line((left, y, left + run - 1, y), fill=0)
            paths.append(f"M{left} {y}h{run}v1H{left}z")
    png = BytesIO()
    raster.resize((side * SCALE, side * SCALE), Image.Resampling.NEAREST).save(
        png, format="PNG", dpi=(600, 600), optimize=False, compress_level=9,
    )
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{side * SCALE}" height="{side * SCALE}" '
           f'viewBox="0 0 {side} {side}" shape-rendering="crispEdges">\n'
           f'  <title>QR code for {url}</title>\n'
           f'  <rect width="{side}" height="{side}" fill="#fff"/>\n'
           f'  <path fill="#000" d="{"".join(paths)}"/>\n</svg>\n')
    return {"svg": svg.encode("ascii"), "png": png.getvalue()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if not args.check:
        OUTPUT.mkdir(exist_ok=True, parents=True)
    failed = []
    slugs = json.loads(subprocess.check_output([
        "node", "-e", "process.stdout.write(JSON.stringify(Object.keys(require('./assets/library-schema.js').groups)))"
    ], cwd=ROOT, encoding="utf-8"))
    for slug in slugs:
        for ext, data in artwork(f"{BASE}{slug}/").items():
            target = OUTPUT / f"{slug}.{ext}"
            if args.check:
                existing = target.read_bytes() if target.is_file() else b""
                # Git may check out these text SVGs with local line endings.
                if ext == "svg":
                    existing = existing.replace(b"\r\n", b"\n")
                if existing != data:
                    failed.append(target.name)
            else:
                target.write_bytes(data)
    if failed:
        raise SystemExit("Missing or nonmatching QR files: " + ", ".join(failed))
    print(f"{'Checked' if args.check else 'Generated'} {len(slugs) * 2} QR files.")


if __name__ == "__main__":
    main()
