#!/usr/bin/env python3
import pathlib

files = [
    "assets/data/menu.csv",
    "assets/data/acrescimos.csv",
    "assets/data/entrega.csv",
]

root = pathlib.Path(__file__).resolve().parents[1]

for f in files:
    p = root / f
    if not p.exists():
        print(f"Arquivo não encontrado: {p}")
        continue
    bak = p.with_suffix(p.suffix + ".bak")
    if not bak.exists():
        p.rename(bak)
        print(f"Backup criado: {bak}")
    else:
        print(f"Backup já existe: {bak}")
    # Read as latin-1 and write as utf-8
    text = bak.read_text(encoding="latin-1")
    p.write_text(text, encoding="utf-8")
    print(f"Convertido para UTF-8: {p}")

print("Pronto. Verifique os arquivos em assets/data.")
