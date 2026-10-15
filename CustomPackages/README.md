# CustomPackages

Local equivalents of NuGet / DLL packages for IMS.

| Folder | Package | Role |
| --- | --- | --- |
| `@mesix/theme` | `@mesix/theme` | Design tokens + theme API |
| `@mesix/custom-control` | `@mesix/custom-control` | UI controls |

These folders contain **built** library output (compiled JS, typings, styles), not Angular source.

## Refresh after rebuilding Mesix_Common

```bash
# from Mesix_Common
cd ../Mesix_Common/theme && npm run build
cd ../custom_control && npm run build

# from IMS
npm run sync:mesix
npm install
```

IMS `package.json` references:

```json
"@mesix/theme": "file:CustomPackages/@mesix/theme",
"@mesix/custom-control": "file:CustomPackages/@mesix/custom-control"
```
