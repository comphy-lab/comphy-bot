# Agent Instructions

This is Worthington's personal website — `https://comphy-lab.org/comphy-bot`.

Built with Jekyll, based on the same template as `comphy-lab/VatsalSy`.

## Structure

- `index.html` — main page (includes `about.md` content)
- `about.md` — Worthington's about section (edit this for content updates)
- `_config.yml` — site config (`baseurl: /comphy-bot`, `url: https://comphy-lab.org`)
- `_layouts/default.html` — layout (stripped-down version of VatsalSy's)
- `assets/` — inherited CSS/JS/logos from VatsalSy template

## Dev

```bash
bundle install
bundle exec jekyll serve
```

## Deployment

Served as a subpath of `comphy-lab.org` via the `comphy-lab/comphy-bot` GitHub repo and GitHub Pages.
The `baseurl` must remain `/comphy-bot`.

## Notes

- Keep it minimal — single page is fine
- Do not add personal stats widgets (this is a bot, not a person)
- The CoMPhy Lab logo and Durham University logo stay in the footer
- `comphy-bot/README.md` (in the parent `comphy-bot/` folder) is the GitHub profile README — keep them consistent
