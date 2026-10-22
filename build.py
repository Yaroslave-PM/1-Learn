"""Собирает src/ в один файл index.html. Запуск: python3 build.py"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
PARTS = [('STYLE', 'style.css'), ('BSL', 'bsl.js'), ('CONTENT_EN', 'content_en.js'), ('CONTENT', 'content.js'),
         ('DICT', 'i18n_dict.js'), ('I18N', 'i18n.js'), ('SURF', 'surfdata.js'), ('APP', 'app.js')]

html = (SRC / 'index.html').read_text(encoding='utf-8')
for key, name in PARTS:
    text = (SRC / name).read_text(encoding='utf-8')
    assert '</script' not in text.lower(), name
    assert f'/*{key}*/' in html, key
    html = html.replace(f'/*{key}*/', text, 1)
(ROOT / 'index.html').write_text(html, encoding='utf-8')
print('index.html:', len(html.encode('utf-8')) // 1024, 'KB')
