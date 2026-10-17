# IMS reporting

## Architecture

`MesixReporting` is a standalone Angular library in `E:\Work\MesixReporting`. It provides report contracts, parameter-window registration and hosting, paged result interfaces, export generation, and the shared export activity card. The library has no IMS or Firebase dependency. IMS supplies the report catalog, data providers, and filter components.

Every report is a code-registered `ReportDefinition` with a stable id, column metadata, a `parameterWindowId`, a paged `loadPage` provider, a full-result `loadAll` provider, an optional filter-aware header, and an optional `loadAggregates` provider. A report's parameter-window id maps to a developer-owned component extending `ReportParameterWindowComponent`; each component defines its own report-specific filters and emits filter values plus user-facing labels. The grid is the report body. Aggregates are calculated for all matching records, not only the current grid page, and are included in XLSX, DOCX, and PDF exports.

Each report has its own route and privilege under the Reports menu group. Add a privilege enum/catalog entry, an individually guarded route, a menu entry, a report definition, and its parameter-window registration when adding a report. The current report ids are `inventory-on-hand`, `sales`, `purchases`, and `cash-flow`. Their parameter windows cover branch/product/brand, branch/date/customer, branch/date/vendor, and branch/date/movement/counterparty respectively.

Report rows use business fields only. Firestore document IDs remain internal join keys and never serve as visible references or fallback branch labels. New stock records receive a human reference number (`IMS-YYYY-######`) through a transactional yearly counter in `SystemCounters`; legacy stock records without a reference display “Not recorded” until migrated.

## Current catalog and accounting limits

- **Inventory on hand:** branch-level quantities, reserved/available units, selling price, and estimated retail value. Retail value is not inventory cost.
- **Sales and stock out:** approved outbound inventory records.
- **Purchases and returns:** approved inbound inventory records.
- **Cash flow ledger:** cash movements explicitly entered in `financial_cash_transactions`.

The sales/stock-out register and purchase/return register label transaction kinds from the customer/vendor relationship stored on each transaction. Their amount totals are transaction totals, not profit calculations. Inventory aggregates include product/branch row count and units on hand, reserved, and available. Cash flow aggregates show inflows, outflows, net movement, and movement count.

The ledger fields are `branchId`, `branchName`, `transactionDate`, `type`, `amount`, `category`, `party`, `reference`, `notes`, `createdAt`, and `createdBy`. Reports scope records to the user's associated branches; a branch id of `0` grants all-branch access. Branch, customer, vendor, product, and brand identifiers are internal filter and join keys; the UI displays names.

The existing inventory records do not preserve cost of goods sold for each historical sale, and historical cash receipts, supplier payments, and operating expenses are not captured. Accurate profit/loss, gross profit, and inventory cost valuation require an accounting foundation: capture purchase costs, apply FIFO or weighted-average costing, snapshot cost at sale/approval, and reconcile opening balances and historical transactions. The current reports intentionally do not present estimated values as accounting profit.

## Build and local package sync

Build the standalone library from `E:\Work\MesixReporting`:

```powershell
npm install
npm run build
```

Then sync the generated package to IMS and build the app:

```powershell
cd E:\Work\IMSAngularDev\IMSAngular
npm run sync:mesix-reporting
npm install
npx ng build --optimization=false --progress=false
```

The package sync copies `E:\Work\MesixReporting\dist\mesix-reporting` to `CustomPackages\@mesix\reporting`. Re-run it after library changes before rebuilding IMS.

## Firestore index prerequisites

`firebase.json` points to `firestore.indexes.json`. This file declares the composite indexes used by report queries, but it does not create them in Firebase by itself. The Firebase CLI must be installed and authenticated, and the actual Firebase project id must be known. This workspace does not contain a `.firebaserc`, so no project can safely be inferred.

From `E:\Work\IMSAngularDev\IMSAngular`, log in and deploy only the index declarations to the intended project:

```powershell
firebase login
firebase projects:list
firebase deploy --only firestore:indexes --project <your-firebase-project-id>
```

Replace the placeholder with the exact Firebase project id used by this IMS environment. In Firebase Console → Firestore Database → Indexes, wait until each deployed index shows **Enabled**; creation can take several minutes. If a future query needs another composite index, Firebase returns an index-creation link; add that index definition to `firestore.indexes.json` and deploy again. Firestore security rules and Firebase project configuration remain separate prerequisites for running the application.
