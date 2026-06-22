# scripts/trim_trailing_whitespace.py

import subprocess
from pathlib import Path

EXTS = {".md", ".yml", ".yaml", ".css", ".js"}

result = subprocess.run(
    ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    check=True,
    text=True,
    capture_output=True,
)

changed: list[str] = []

for name in result.stdout.splitlines():
    path = Path(name)
    if path.suffix not in EXTS or not path.exists() or not path.is_file():
        continue

    original = path.read_bytes()
    text = original.decode("utf-8")

    fixed = "\n".join(line.rstrip() for line in text.splitlines())
    if text.endswith("\n"):
        fixed += "\n"

    data = fixed.encode("utf-8")
    if data != original:
        path.write_bytes(data)
        changed.append(str(path))

if changed:
    subprocess.run(["git", "add", *changed], check=True)
    print("Trimmed trailing whitespace:")
    for item in changed:
        print(f"  {item}")
