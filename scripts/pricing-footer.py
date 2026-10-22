#!/usr/bin/env python3
"""Add only the pricing link, preserving each environment's existing landing HTML."""
import argparse
from pathlib import Path
import re

LABELS = {'uk': 'Тарифи', 'ru': 'Тарифы', 'en': 'Pricing', 'pl': 'Cennik', 'cs': 'Ceník'}

def with_pricing_link(html, lang):
    if 'data-pricing-link' in html:
        return html
    link = f'<a data-pricing-link href="/pricing?lang={lang}">{LABELS[lang]}</a>'
    # Live landing design and the previous Git version have different footers.
    modern = re.search(r'<div\s+class="footer-links"\s*>', html)
    if modern:
        return html[:modern.end()] + '\n        ' + link + html[modern.end():]
    legacy = re.search(r'<footer\s+class="footer"\s*>\s*<div\s+class="container"\s*>', html)
    if legacy:
        return html[:legacy.end()] + '\n            <p>' + link + '</p>' + html[legacy.end():]
    raise ValueError(f'Cannot identify {lang} footer; refusing to change HTML')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    # Validate all languages before writing any file.
    changes = []
    for lang in LABELS:
        target = args.root / lang / 'index.html'
        before = target.read_text()
        changes.append((target, before, with_pricing_link(before, lang)))
    for target, before, after in changes:
        if before != after:
            temporary = target.with_suffix('.pricing-tmp')
            temporary.write_text(after)
            temporary.chmod(target.stat().st_mode & 0o777)
            temporary.replace(target)
        print(f'{target}: pricing link present')
