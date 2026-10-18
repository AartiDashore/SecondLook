# Sound-inspired visual style

Reviewed October 18, 2026 on the Mariana branch.

## References

- [Sound Credit Union website](https://www.soundcu.com/): navy typography, medium-blue actions, light blue surfaces, and generous spacing. Marketing headings use a serif face.
- [Official mobile banking page](https://www.soundcu.com/personal/mobile-banking/) and its [Bill Pay screenshot](https://www.soundcu.com/files/MobileApp_BillPay__540x330.jpg): navy app header, white content, pale blue section separators, and compact sans-serif text. These are published promotional examples, not a live authenticated app inspection.
- User-provided `preview (1).png`: navy headings and primary action, muted blue-gray supporting text, pale page background, rounded white cards, outlined secondary action, and a yellow score ring.

## Applied direction

Use the supplied image as the main visual reference, with the public website and app as brand context. Colors are approximations for this prototype, not official brand specifications.

| Token | Light color | Purpose |
| --- | --- | --- |
| Navy | `#05265e` | Headings, primary buttons, secondary button outlines |
| Blue | `#197db0` | Accents, focus indicators, links |
| Page | `#f5f8fc` | Pale page canvas |
| Surface | `#ffffff` | Cards and member panel |
| Muted | `#576985` | Supporting text |
| Border | `#dce5f0` | Quiet separators and card outlines |
| Pale blue | `#e7f2fa` | Notices and review badges |
| Yellow | `#f2c21f` | Score indicator only, per user direction |

All presentation lives in `styles.css`. The HTML links to it; employee action feedback uses a CSS class and score visualization uses a native progress element. Retain Atkinson Hyperlegible for readable prototype text, rounded cards and large touch targets from the reference, responsive single-column layout, visible keyboard focus, and optional dark-theme support with blue-based tokens. The page defaults to light to match the supplied reference; set `data-theme="dark"` for dark or remove the attribute to follow the system.

The reference image labels its number a confidence score (higher is better). The existing prototype calculates risk points (higher prompts more intervention). This style change preserves that risk model and its labels; it does not introduce a confidence score or reverse its meaning.

## Preview

Run the VS Code preview task and open `/prototype.html`, or serve this directory with Python's `http.server`. Use the Member, Employee, and Risk lab tabs to inspect the button hierarchy, selected-action feedback, and score color.


## Score color update

Score text and the progress indicator use red below 30, readable gold/yellow from 30 through 70, and green above 70. The numeric score remains visible. Dark mode uses lighter tones. These presentation thresholds are independent of the existing risk tiers; scoring and intervention logic remain unchanged.
