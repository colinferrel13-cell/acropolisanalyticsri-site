"""Package the unchanged group QR images for print authors; no network or third-party packages."""
import argparse
import csv
import io
import json
import subprocess
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_STORED

ROOT = Path(__file__).resolve().parents[1]
QR = ROOT / "assets" / "qr"
BUNDLE = QR / "acropolis-topic-qr.zip"

def build():
    groups = json.loads(subprocess.check_output([
        "node", "-e", "process.stdout.write(JSON.stringify(require('./assets/library-schema.js').groups))"
    ], cwd=ROOT, encoding="utf-8"))
    host = (ROOT / "CNAME").read_text(encoding="utf-8").strip()
    manifest = io.StringIO(newline="")
    rows = csv.writer(manifest)
    rows.writerow(("group", "kind", "permanent_url", "png", "svg"))
    members = {}
    for key, group in groups.items():
        url = f"https://{host}/topics/{key}/"
        rows.writerow((group["label"], group["kind"], url, f"png/{key}.png", f"svg/{key}.svg"))
        for extension in ("png", "svg"):
            file = QR / f"{key}.{extension}"
            data = file.read_bytes()
            members[f"{extension}/{file.name}"] = data.replace(b"\r\n", b"\n") if extension == "svg" else data
    members["destinations.csv"] = manifest.getvalue().encode("utf-8-sig")
    members["START-HERE.txt"] = (
        "Acropolis Analytics Research Institute | Group QR codes\n\n"
        "Find the group and its web address in destinations.csv. Use the SVG when your\n"
        "layout program supports it, or the PNG otherwise. Both encode the same URL.\n"
        "Keep the entire white border. Do not crop, stretch, tint, or place artwork over\n"
        "the code. Make the URL clickable in the PDF and print it next to the code.\n"
        "Scan a final-size proof with a phone before distribution. A group code opens\n"
        "all releases in that group, not the individual report, a study, or a survey.\n"
        f"Latest group links and codes: https://{host}/topics/\n"
    ).encode()
    data = io.BytesIO()
    with ZipFile(data, "w") as output:
        for name, value in sorted(members.items()):
            entry = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            entry.compress_type = ZIP_STORED
            output.writestr(entry, value)
    return data.getvalue()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the committed bundle")
    args = parser.parse_args()
    data = build()
    if args.check:
        if not BUNDLE.is_file() or BUNDLE.read_bytes() != data:
            raise SystemExit("QR bundle is missing or stale. Run tools/package-topic-qr.py.")
        print("QR bundle matches all registered groups.")
    else:
        BUNDLE.write_bytes(data)
        print(f"Packaged {BUNDLE.name} ({len(data):,} bytes).")
