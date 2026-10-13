# @mesix/theme

Design tokens and runtime theme API for Mesix apps.

## Themes (Google Drive style)

| Id | Mode | Look |
| --- | --- | --- |
| `light` | light | Drive light — white surfaces, `#F8F9FA` canvas, `#1A73E8` blue |
| `dark` | dark | Drive dark — `#1B1B1B` canvas, `#2D2E30` surfaces, `#8AB4F8` blue |

```ts
theme.apply({ themeId: 'light' });
theme.apply({ themeId: 'dark' });
```

### Four brand colors (light)

| Role | Hex |
| --- | --- |
| Brand Blue | `#1A73E8` |
| Support Blue | `#1967D2` |
| Ink | `#202124` |
| Canvas | `#F8F9FA` |

### Four brand colors (dark)

| Role | Hex |
| --- | --- |
| Brand Blue | `#8AB4F8` |
| Support Blue | `#AECBFA` |
| Ink | `#E8EAED` |
| Canvas | `#1B1B1B` |

## Consumer setup

```json
"@mesix/theme": "file:CustomPackages/@mesix/theme"
```

Styles: `node_modules/@mesix/theme/styles/mesix-theme.scss`
