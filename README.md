# Heris Walter Gemperle: Portfolio

Personal portfolio of Heris Walter Gemperle, 2nd year Computer Science student at Polytechnic College of Botolan, Zambales, and founder of TapKo.

Plain HTML, CSS and JavaScript. No frameworks, no build step.

## Workflow

Class workflow: Figma (wireframe → mockup → prototype) → prompt → AI model → code editor / IDE → push to GitHub → deployment.

Design: https://www.figma.com/design/tA2KKHAlSZOUUhBuUaCQkG/Heris-Walter-Gemperle

## Run it

Open `index.html` in a browser. To serve it locally instead:

```
python -m http.server 8000
```

Then visit http://localhost:8000.

## Files

```
index.html          page structure and content
style.css           design system and layout (Swiss style: white, ink, one orange accent)
script.js           sticky header, nav underline, mobile menu, skills slider, hero parallax, scroll reveals, project window tilt, copy email, footer clock, optional sounds
assets/             logo, hero portrait, TapKo screenshots, self-hosted Hanken Grotesk font
```

## Deploy to GitHub Pages

1. Create a repository on GitHub and push these files to the `main` branch.
2. In the repository, open Settings, then Pages.
3. Under Build and deployment, set Source to "Deploy from a branch", choose `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Notes

- Fonts are self-hosted, so the page makes no third-party requests.
- Works from 360px phones to wide desktops, respects reduced-motion settings, and is keyboard accessible.
