#!/usr/bin/env python3
from pathlib import Path

files = [
    Path("assets/data/menu.csv"),
    Path("assets/data/acrescimos.csv"),
    Path("assets/data/entrega.csv"),
]

replacements = {
    'Preï¿½o': 'Preço',
    'Preï¿½o Grande': 'Preço Grande',
    'Preï¿½o Junior': 'Preço Júnior',
    'Hambï¿½rguer': 'Hambúrguer',
    'Hamburgï¿½o': 'Hamburgão',
    'Brï¿½colis': 'Brócolis',
    'Contra Filï¿½': 'Contra Filé',
    'Contra-filï¿½': 'Contra-filé',
    'Porï¿½ï¿½es': 'Porções',
    'Pï¿½o': 'Pão',
    'francï¿½s': 'francês',
    'ï¿½ Moda': 'à Moda',
    'Linguiï¿½a': 'Linguiça',
    'Jardim Bicï¿½o': 'Jardim Bicão',
    'Redenï¿½ï¿½o': 'Redenção',
    'Redenï¿½o': 'Redenção',
    'Santa Felï¿½cia': 'Santa Felícia',
}

# lower-case and other common variants
replacements.update({
    'brï¿½colis': 'brócolis',
    'contra filï¿½': 'contra filé',
    'linguiï¿½a': 'linguiça',
    'linguiï¿½a apimentada': 'linguiça apimentada',
    'contra filï¿½,': 'contra filé,',
    'filï¿½': 'filé',
    'brï¿½colis,': 'brócolis,',
    'Pï¿½o francï¿½s': 'Pão francês',
})

root = Path(__file__).resolve().parents[1]

for f in files:
    p = root / f
    if not p.exists():
        print(f"Arquivo não encontrado: {p}")
        continue
    text = p.read_text(encoding='utf-8')
    orig = text
    for k, v in replacements.items():
        if k in text:
            text = text.replace(k, v)
    if text != orig:
        p.write_text(text, encoding='utf-8')
        print(f"Corrigido: {p}")
    else:
        print(f"Nenhuma substituição necessária: {p}")

print('Substituições concluídas.')
