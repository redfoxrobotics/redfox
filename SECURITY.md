# Website security

Reviewed on 1 October 2026. This is a public static website hosted on GitHub Pages. It has no accounts, database, payment processing, or server-side form handler.

## Protections

- GitHub Pages enforces HTTPS. Both HTTP domains redirect to the HTTPS website. The live host supplies HTTP Strict Transport Security.
- Each HTML page declares a Content Security Policy before it loads any resources. Inline JavaScript, inline event handlers, unapproved scripts, network requests from scripts, embedded frames, plugins, workers, form submissions, and changes to the document's base URL are blocked.
- The homepage permits only the specific SHA-384 integrity-checked website script. The portfolio runs no JavaScript. Styling is in separate stylesheets so the policy does not need `unsafe-inline` or `unsafe-eval`.
- External styles and fonts are limited to the providers the pages use. The portfolio's pinned Bootstrap and Bootstrap Icons stylesheets have SHA-384 integrity checks. Its unused third-party JavaScript bundle was removed.
- Referrers are suppressed. Links opening new tabs use `noopener noreferrer`.
- GitHub secret scanning and secret push protection were already enabled; no open secret alerts were reported during the review. Dependabot vulnerability alerts and automatic security fixes were enabled. Dependabot monitors the pinned GitHub Actions dependency.
- Security checks run on pushes to main and pull requests with read-only repository permissions and without persisted checkout credentials. These checks report regressions; they are not a replacement for branch protection or a deployment approval gate.
- Local environment and private-key files are excluded from Git. Never add credentials to browser code or commit them to this public repository.

## Validate changes

Run `python scripts/check_security.py` before publishing. If you intentionally edit `assets/js/site.js`, run `python scripts/check_security.py --update-script-hash` to update its integrity attribute and the matching policy hash, then commit both the script and the HTML.

The initial browser checks verified that normal resources and the mobile menu work, and that attempts to inject inline scripts, a same-origin unapproved script, inline event handlers, external fetches, frames, and a replacement base URL were blocked.

## Hosting limits

The policy is delivered through HTML because this GitHub Pages deployment does not provide a custom response-header configuration. Do not add an unused `_headers` file or unsupported meta tags and claim they protect the site. In particular, `frame-ancestors`, `X-Frame-Options`, `Permissions-Policy`, and `X-Content-Type-Options` need response-header support. The current `frame-src 'none'` prevents the site from loading frames; it does not prevent other sites from framing this site.

For protection against framing and configurable bot filtering or rate limits, configure a suitable CDN/reverse proxy or move to hosting that supports those controls. This requires access to the domain's DNS and hosting accounts. Verify the custom domain in the owner's GitHub account as well, and keep that account protected with two-factor authentication. Account-level controls and DNS verification were not changed in this review.

External CSS integrity hashes must be regenerated and checked when their versions change. Security alerts and automated dependency updates do not track CDN-only CSS dependencies, so review those pinned versions periodically. No known advisories were returned for the reviewed CSS package versions; this is not a guarantee that the website is free of vulnerabilities.

## Report an issue

Report suspected vulnerabilities privately to StartUp.mailrobotics@gmail.com. Do not publish credentials, personal data, or exploitable details in a public issue.
