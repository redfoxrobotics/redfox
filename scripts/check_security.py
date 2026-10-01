"""Check the static site's security policy and resource references."""
from base64 import b64encode
from hashlib import sha384
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


def script_integrity():
    return 'sha384-' + b64encode(sha384((ROOT / 'assets/js/site.js').read_bytes()).digest()).decode()


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


def check_page(path):
    page = Page()
    page.feed(path.read_text(encoding='utf-8'))
    errors = []
    policies = [a.get('content', '') for t, a in page.tags if t == 'meta' and a.get('http-equiv', '').lower() == 'content-security-policy']
    if len(policies) != 1:
        return ['Each page must have exactly one Content Security Policy.']
    policy = dict((parts[0], parts[1:]) for directive in policies[0].split(';') if (parts := directive.split()))
    for name in ['default-src', 'script-src-attr', 'style-src-attr', 'connect-src', 'object-src', 'base-uri', 'form-action', 'frame-src', 'worker-src']:
        if policy.get(name) != ["'none'"]:
            errors.append(f'{name} must deny unnecessary capabilities.')
    for value in policies[0].split():
        if value in ["'unsafe-inline'", "'unsafe-eval'", '*', 'http:', 'https:']:
            errors.append(f'Unsafe policy source: {value}')
    if 'upgrade-insecure-requests' not in policy:
        errors.append('Insecure resource requests must be upgraded.')
    if any(name in policy for name in ['frame-ancestors', 'sandbox', 'report-uri']):
        errors.append('Do not claim header-only protections in a meta policy.')
    referrers = [a.get('content') for t, a in page.tags if t == 'meta' and a.get('name') == 'referrer']
    if referrers != ['no-referrer']:
        errors.append('A no-referrer privacy policy is required.')
    first_resource = next((i for i, (t, _) in enumerate(page.tags) if t in ['script', 'style', 'link', 'img']), len(page.tags))
    csp_index = next(i for i, (t, a) in enumerate(page.tags) if t == 'meta' and a.get('http-equiv', '').lower() == 'content-security-policy')
    if csp_index > first_resource:
        errors.append('The policy must appear before any loaded resources.')

    ids = {a['id'] for _, a in page.tags if 'id' in a}
    scripts = []
    for tag, attrs in page.tags:
        if tag == 'style' or 'style' in attrs:
            errors.append('Inline styles are forbidden; use an approved stylesheet.')
        if any(key.startswith('on') for key in attrs):
            errors.append('Inline event handlers are forbidden.')
        if tag == 'script':
            scripts.append(attrs)
            if not attrs.get('src'):
                errors.append('Inline scripts are forbidden.')
            elif urlsplit(attrs['src']).scheme or attrs['src'].startswith('//'):
                errors.append('Third-party scripts are forbidden.')
        if attrs.get('target') == '_blank' and not {'noopener', 'noreferrer'} <= set(attrs.get('rel', '').split()):
            errors.append('New tabs need noopener and noreferrer.')
        if tag == 'link' and attrs.get('rel') == 'stylesheet' and urlsplit(attrs.get('href', '')).hostname == 'cdn.jsdelivr.net':
            if not re.fullmatch(r'sha384-[A-Za-z0-9+/]{64}', attrs.get('integrity', '')) or attrs.get('crossorigin') != 'anonymous':
                errors.append('CDN stylesheets must have SHA-384 integrity and anonymous CORS.')
        for attribute in ['src', 'href']:
            value = attrs.get(attribute, '')
            if not value:
                continue
            url = urlsplit(value)
            if url.scheme in ['http', 'javascript', 'vbscript'] or value.startswith('//'):
                errors.append(f'Unsafe resource or navigation URL in {attribute}.')
            elif not url.scheme:
                if url.path:
                    target = (path.parent / unquote(url.path)).resolve()
                    if not target.is_relative_to(ROOT) or not target.is_file():
                        errors.append(f'Missing or invalid local resource: {value}')
                elif url.fragment and unquote(url.fragment) not in ids:
                    errors.append(f'Missing fragment target: {value}')
    if path.name == 'index.html':
        expected = script_integrity()
        if policy.get('script-src') != [f"'{expected}'"]:
            errors.append('Script policy hash is stale. Run this checker with --update-script-hash.')
        if len(scripts) != 1 or scripts[0].get('src') != 'assets/js/site.js' or scripts[0].get('integrity') != expected:
            errors.append('The main page must load only the integrity-checked site script.')
    elif scripts or policy.get('script-src') != ["'none'"]:
        errors.append('The portfolio must not run JavaScript.')
    return errors


def main():
    if '--update-script-hash' in sys.argv:
        path = ROOT / 'index.html'
        html = path.read_text(encoding='utf-8')
        digest = script_integrity()
        html = re.sub(r"script-src [^;]+;", f"script-src '{digest}';", html, count=1)
        html = re.sub(r'<script src="assets/js/site.js"[^>]*>', f'<script src="assets/js/site.js" integrity="{digest}" defer>', html, count=1)
        path.write_text(html, encoding='utf-8', newline='\n')
    failures = []
    for path in sorted(ROOT.glob('*.html')):
        errors = check_page(path)
        failures.extend(f'{path.name}: {error}' for error in errors)
        print(f'{path.name}: {"FAILED" if errors else "passed"}')
    if failures:
        print('\n'.join(failures), file=sys.stderr)
        return 1
    print('Security policies, integrity hashes, local assets, and links passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
