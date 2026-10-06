"""Collect public static assets for Sites, excluding source and private files."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import shutil
root=Path(__file__).resolve().parents[1]
out=root/'dist'
out.mkdir(exist_ok=True)
class Assets(HTMLParser):
    def handle_starttag(self,tag,attrs):
        for key,value in attrs:
            if key not in ('src','href','poster') or not value: continue
            url=urlsplit(value)
            if url.scheme or not url.path: continue
            source=(root/unquote(url.path)).resolve()
            if not source.is_relative_to(root) or not source.is_file(): continue
            target=out/source.relative_to(root)
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(source,target)
for page in root.glob('*.html'):
    shutil.copy2(page,out/page.name)
    Assets().feed(page.read_text(encoding='utf-8'))
print('Static website prepared.')
