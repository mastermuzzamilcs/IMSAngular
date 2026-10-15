# @mesix/custom-control

Standalone Angular controls for Mesix corporate apps. Styling expects `@mesix/theme` CSS variables (`--mx-*`).

## Install (local)

```json
"@mesix/theme": "file:../Mesix_Common/theme/dist/mesix-theme",
"@mesix/custom-control": "file:../Mesix_Common/custom_control/dist/mesix-custom-control"
```

Load theme styles once, then mount hosts:

```html
<mx-spinner></mx-spinner>
<mx-toast-host></mx-toast-host>
<mx-dialog-host></mx-dialog-host>
```

## Controls

| Selector / API | Purpose |
| --- | --- |
| `MxNoticeService` + `mx-toast-host` / `mx-dialog-host` | Toasts & dialogs (success/warning/error/info, optional input) |
| `MxLoadingService` + `mx-spinner` | Global or local loading overlay |
| `mx-button` | Solid / soft / outline / ghost / link, tones & sizes |
| `mx-card` | Content card with optional title/actions/footer slots |
| `mx-badge` | Status pills |
| `mx-alert` | Inline banners |
| `mx-empty-state` | Empty list / no-data panels |
| `mx-table-skeleton` | Shimmer placeholder rows for table loading |
| `mx-grid` | Data grid shell (filter, footer, optional `[loading]` skeleton) |
| `mx-page-header` | Page title row with action slot |

## Flexibility

- Size: `sm` \| `md` \| `lg`
- Tone: `neutral` \| `primary` \| `success` \| `warning` \| `danger` \| `info`
- Content projection for actions and body
- Dialog size follows content (`auto`) or `compact` / `wide` / custom `width`
- Toast `durationMs`, position on host
- Spinner `mode` fixed/local, optional label
- Nested loading counter on `MxLoadingService`

Colors come from theme tokens — change palette in `@mesix/theme` without editing controls.
