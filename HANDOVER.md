# Handover — Full Change Log

This document covers every change made in this session. It is intended as a complete technical reference for anyone picking this up.

---

## 1. Schema Changes (`prisma/schema.prisma`)

### New models

**`RawMaterialDailyStock`** (`raw_material_daily_stocks`)
Tracks the opening and current stock of a raw material for a specific calendar date. One row per material per day. Used by recipe-based items to compute how many portions can be made.

```
date          String     — YYYY-MM-DD
openingStock  Float
currentStock  Float
rawMaterialId String     — FK → RawMaterial
setById       String     — FK → User
@@unique([date, rawMaterialId])
@@index([date])
```

**`RawMaterialUsage`** (`raw_material_usages`)
The recipe table. Each row says "this menu item consumes `quantity` units of this raw material per portion". A menu item with at least one `RawMaterialUsage` row is called a **recipe item**.

```
menuItemId    String     — FK → MenuItem
rawMaterialId String     — FK → RawMaterial
quantity      Float
```

**`DailyItemStockSnapshot`** (`daily_item_stock_snapshots`)
Per-day stock for items that are NOT recipe-driven (i.e. they have no `RawMaterialUsage` rows). Stores opening stock, current stock, sold quantity, and waste. Two users are tracked: who opened and who closed the snapshot.

```
date          String
menuItemId    String
openingStock  Float?
currentStock  Float?
soldQuantity  Float?
wasteQuantity Float      @default(0)
closingStock  Float?
closedAt      DateTime?
openedById    String?    — FK → User (relation "ItemStockOpener")
closedById    String?    — FK → User (relation "ItemStockCloser")
@@unique([date, menuItemId])
```

**`OrderItemVoid`** (`order_item_voids`)
Audit log written when a manager removes an item from a submitted order. Stores the original quantity, unit price, and reason. The order total is recalculated on void.

```
orderId       String
menuItemId    String
quantity      Int
unitPrice     Float
reason        String?
voidedById    String     — FK → User
createdAt     DateTime
```

**`Promotion`** / **`PromotionItem`** (`promotions`, `promotion_items`)
Time-bounded discount rules. Three types: `PERCENTAGE`, `FIXED_AMOUNT`, `BUY_X_GET_Y_FREE`. Optional time window (`startTime`/`endTime` as `HH:MM` strings), days-of-week bitmask array, minimum order amount. `PromotionItem` optionally scopes the promotion to specific menu items.

**`BusinessSettings`** (`business_settings`)
Singleton row (always `id = 'singleton'`). Stores configurable restaurant identity and receipt settings: `restaurantName`, `tagline`, `address`, `phone`, `feedbackUrl`, `momoMerchantId`, `momoUssdNumber`, `defaultTaxRate`, `defaultServiceCharge`, `receiptFooter`, `showReceiptQR`, `openingTime`, `closingTime`.

### Changes to existing models

**`Order`**
- Default status changed from `COMPLETED` → `PENDING`. Orders now start as pending and must be explicitly completed.
- Added `completedAt DateTime?` — set when an order is moved to COMPLETED.

**`MenuItem`**
- Added `dailyItemSnapshots DailyItemStockSnapshot[]` relation.
- Added `promotionItems PromotionItem[]` relation.

**`MaterialCategory`**
- Added optional `rawMaterialId String? @unique` — links a material purchase category to a raw material so that recording a purchase auto-increments that raw material's stock.

**`User`**
- Added relations: `voidedItems OrderItemVoid[]`, `closedItemSnapshots DailyItemStockSnapshot[]` (alias `ItemStockCloser`), `openedItemSnapshots DailyItemStockSnapshot[]` (alias `ItemStockOpener`), `rawMaterialDailyStocks RawMaterialDailyStock[]`.

---

## 2. New API Routes

### `GET /api/orders/events`
SSE endpoint. On connection, immediately sends an `initial` event with all current `PENDING` orders (full include: orderItems → menuItem → category, payments, user). Then streams `order.new` and `order.updated` events as they happen. Used by the kitchen display and can be consumed by any component.

Returns `text/event-stream`. Each message is `data: {"type":"...","data":{...}}\n\n`.

### `PATCH /api/kitchen/orders/[id]/ready`
Marks an order as `COMPLETED` from the kitchen. No session required (kitchen display is unauthenticated). Internally calls the same status update path and broadcasts the SSE event.

### `GET /api/stock/items`
Returns today's `DailyItemStockSnapshot` rows joined with menu item + category names. Used by the stock management component's item-stock tab.

### `POST /api/stock/items/open`
Creates or updates a `DailyItemStockSnapshot` for today with an opening stock value. Accepts `{ menuItemId, openingStock }`.

### `POST /api/stock/items/close`
Sets `closingStock`, `closedAt`, and `closedById` on today's snapshot. Accepts `{ menuItemId, closingStock, wasteQuantity }`.

### `GET /api/stock/pools`
Returns today's `RawMaterialDailyStock` rows joined with raw material names and units. Shows opening/current stock for each raw material that has a pool record today.

### `DELETE /api/orders/[id]/items/[itemId]`
Voids a specific order item. Requires `MANAGER` or `ADMIN` role. Steps:
1. Creates an `OrderItemVoid` audit record.
2. Removes the `OrderItem`.
3. Recalculates and updates the order's subtotal, tax, and total.
4. Returns the updated order with all items.

Body: `{ reason?: string }`.

### `GET/POST /api/promotions`
List all promotions or create one. `POST` body is validated with Zod and includes all `Promotion` fields.

### `PATCH/DELETE /api/promotions/[id]`
Update or delete a promotion.

### `POST /api/promotions/applicable`
Given a cart (`{ subtotal, items: [{ menuItemId, quantity, unitPrice }] }`), finds all active promotions that match the current Rwanda time (HH:MM) and day of week. Returns a list of applicable promotions with a calculated `discountAmount` each. The cart component calls this when checkout opens and auto-applies the first match if no manual discount has been set.

Discount calculation logic:
- `PERCENTAGE` → `round(subtotal × value / 100)`
- `FIXED_AMOUNT` → `value`
- `BUY_X_GET_Y_FREE` → per-item free unit calculation across matching cart items

Time check is done in Rwanda time (UTC+2), including midnight rollover correction.

### `GET/PATCH /api/settings`
Reads or updates the `BusinessSettings` singleton. `GET` uses `upsert` to guarantee the row exists with defaults. `PATCH` accepts any subset of the settings fields.

### `GET /api/recipes`
Returns all `RawMaterialUsage` rows with menu item name and raw material name/unit. Used by the recipe management component.

### `POST /api/recipes`
Creates a `RawMaterialUsage` row: `{ menuItemId, rawMaterialId, quantity }`.

### `DELETE /api/recipes/[id]`
Deletes a `RawMaterialUsage` row by ID.

### `GET /api/reports/sales-chart`
Returns `{ dailySales: [...], byCategory: [...] }` for the last 30 days. Used directly on the dashboard and by the sales chart report page.

### `GET /api/reports/date-range`
Accepts `?from=YYYY-MM-DD&to=YYYY-MM-DD`. Returns totals (revenue, orders, tax, service charge, discounts, by payment method, by category). Used by the date-range report component which also exports to CSV.

### `GET /api/reports/food-cost`
For each menu item that has a recipe, calculates: portion cost (sum of `quantity × rawMaterial.cost` per ingredient), revenue per portion, and gross margin. Returns a table sorted by highest cost.

### `GET /api/reports/staff`
Groups completed orders by `userId` and returns: staff name, order count, total revenue, average order value. Accepts optional `?from` and `?to` date params.

### `GET /api/reports/waste`
Aggregates `wasteQuantity` from `DailyItemStockSnapshot` across all days. Returns items sorted by total waste descending, with waste as % of total opening stock.

### `GET /api/reports/inventory-valuation`
Returns each raw material's current stock × cost, and the grand total. Sorted by value descending.

---

## 3. Changed Existing API Routes

### `POST /api/orders`

**Status default**: Orders are now created with `status: 'PENDING'` (previously `COMPLETED`).

**Simplified auth**: Removed the extra `prisma.user.findUnique` call — `auth.userId` is used directly.

**SSE broadcast**: Calls `broadcastOrderEvent('order.new', order)` after creation.

**Stock deduction** (new logic added after order creation):
Two deduction paths run in parallel:

1. **Recipe items (pool deductions)** — for each order item whose menu item has at least one `RawMaterialUsage` row, aggregate quantities across all quantities and call `rawMaterialDailyStock.updateMany({ decrement: amount })` for today's date.

2. **Skewer items (explicit deductions)** — if the order item includes `skewerDeductions: [{ rawMaterialId, amount }]`, those are used directly instead of the recipe lookup. This handles the dynamic skewer selection (variable kofta/sheesh counts).

3. **Non-recipe, non-skewer items (snapshot deductions)** — calls `dailyItemStockSnapshot.updateMany({ decrement: quantity })` on today's snapshot if one exists and `currentStock` is not null.

**New accepted fields**:
- `skewerDeductions` per item: `[{ rawMaterialId: string; amount: number }]`
- `isDelivery: boolean` (default false)

### `PATCH /api/orders/[id]/status`

**Valid transitions updated**: `PENDING → COMPLETED`, `PENDING → CANCELLED`. `COMPLETED` is now a terminal state (no transitions out).

**SSE broadcast**: Calls `broadcastOrderEvent('order.updated', order)` after update.

**`completedAt`**: Set to `new Date()` when status becomes `COMPLETED`.

**Stock restoration on cancel** (new): Mirrors the creation deduction logic. Fetches the order items and their recipes, then restores:
- Pool stock (recipe items): `rawMaterialDailyStock.updateMany({ increment: amount })`
- Snapshot stock (non-recipe items): `dailyItemStockSnapshot.updateMany({ increment: quantity })`

All restoration runs inside the existing `$transaction` alongside the payment refund.

### `GET /api/pos-menu`

Previously just returned active categories with active items. Now:

1. Fetches in parallel: categories + items, today's `DailyItemStockSnapshot` rows, all `RawMaterialUsage` rows, today's `RawMaterialDailyStock` rows.
2. Builds lookup maps: `snapshotMap (menuItemId → currentStock)`, `poolMap (rawMaterialId → currentStock)`, `usagesByItem (menuItemId → [{ rawMaterialId, quantity }])`.
3. For each item:
   - **Recipe item**: calculates `canMake = min(floor(poolStock / usage.quantity))` across all ingredients that have a pool record. Returns `stock: canMake` (integer) or `stock: null` if no limiting ingredient.
   - **Non-recipe item**: returns `stock: Math.max(0, snapshotMap.get(item.id))` or `stock: null` if no snapshot.
4. Response shape is identical to before but each item now has `stock: number | null`.

### `GET /api/stock/materials`

Added a `GET` handler (previously only `POST` existed). Returns all active raw materials with `{ id, name, unit, stock }`. Used by the material management UI when creating a new category — lets the user link the category to a raw material.

### `POST /api/materials`

Wrapped in `prisma.$transaction`. After creating the `MaterialEntry`, if the category has a `rawMaterialId` and the entry has a `quantity`, increments `rawMaterial.stock` by that quantity. This keeps the raw material's aggregate stock in sync with purchase entries.

### `GET /api/materials/categories`

Now includes `rawMaterial: { id, name, unit }` in the response.

### `POST /api/materials/categories`

Accepts optional `rawMaterialId` to link the new category to a raw material. Included in the response via `include`.

---

## 4. New Frontend Files

### `app/kitchen/page.tsx`
Full-screen kitchen display at `/kitchen`. No authentication required. Connects to `/api/orders/events` via `EventSource` with auto-reconnect (3s delay on error).

Displays a card per pending order showing: order number, elapsed time in minutes (ticks every 30s), customer name if set, and each item with its notes parsed into labeled sections. A "Ready" button calls `PATCH /api/kitchen/orders/[id]/ready`.

Connection state shown as Wifi/WifiOff icon in the header. When an `order.updated` event arrives with non-PENDING status, the order is removed from the board.

### `app/(app)/reports/page.tsx`
Reports hub with 6 tabs. Each tab renders the corresponding report component. Accessible to ADMIN and MANAGER.

### `components/reports/sales-line-chart.tsx`
Recharts `LineChart` showing daily total revenue for the past 30 days. Tooltip shows RWF amount and order count. Data comes from `/api/reports/sales-chart`.

### `components/reports/category-bar-chart.tsx`
Recharts `BarChart` showing total revenue by menu category. Same data source.

### `components/reports/date-range-report.tsx`
Date range picker (from/to). Fetches `/api/reports/date-range` and shows: total orders, revenue, tax, service charge, discounts, revenue by payment method, revenue by category. "Export CSV" button builds a CSV blob in the browser and triggers a download.

### `components/reports/food-cost-report.tsx`
Table: menu item name, portion cost (sum of ingredient costs), revenue per portion, gross margin (RWF and %). Rows colored by margin: green (>60%), yellow (40-60%), red (<40%).

### `components/reports/staff-performance.tsx`
Table: staff name, orders processed, total revenue, average order value. Accepts an optional date range passed to `/api/reports/staff`.

### `components/reports/waste-analysis.tsx`
Table: item name, total waste units, waste as % of total opening stock. Sorted by waste descending.

### `components/reports/inventory-valuation.tsx`
Table: raw material name, unit, current stock, cost per unit, total value. Grand total at the bottom.

### `components/settings/business-settings.tsx`
Form to edit `restaurantName`, `tagline`, `address`, `phone`. Saves to `PATCH /api/settings`.

### `components/settings/payment-settings.tsx`
Form to edit `momoMerchantId` and `momoUssdNumber`. These flow through to the MoMo payment modal and the receipt QR code at runtime.

### `components/settings/receipt-settings.tsx`
Toggle for `showReceiptQR`, text field for `receiptFooter`, text field for `feedbackUrl` (used to generate the feedback QR on customer receipts).

### `components/settings/categories-settings.tsx`
Full CRUD for menu categories (name, sort order, active toggle) from the settings screen, without going to Catalog.

### `components/settings/hours-settings.tsx`
`openingTime` and `closingTime` stored in BusinessSettings as `HH:MM` strings.

### `components/settings/promotions-settings.tsx`
Full promotion CRUD. Form supports all promotion types and fields: name, type, value, min order, time window, days of week, buy/get quantities, item scope. List shows active/inactive badges and type labels.

### `components/manage/recipe-management.tsx`
Table of all `RawMaterialUsage` rows grouped by menu item. Add/remove ingredient rows per item. Quantity field is in the raw material's unit. Used within the Stock page.

### `components/pos/sides-modal.tsx`
Two modes controlled by `isSandwich` prop:
- **Sandwich mode**: two large toggle buttons — "With Chips" and "No Chips (−1,000 RWF)". Chips pre-selected.
- **Regular mode**: three pill-button groups (Salads, Carbs, Sauces) loaded live from the DB via `/api/pos-menu`. Free quota counter per group (`X/Y free`). Extra selections shown in amber with their cost (+1,000 RWF each).

`onConfirm(groupSelections: GroupSelection[])` returns the final selections. Parent calculates price adjustments.

### `components/pos/skewer-modal.tsx`
Shown when an item name matches `/skewers?\s*-\s*\d/i` (e.g. "3 Skewers - Mixed"). Lets the user allocate a fixed total skewer count between Kofta and Sheesh using +/− buttons. On confirm, produces a `SkewerSelection` with `counts: { Kofta: N, Sheesh: M }` and `deductions: [{ rawMaterialId, amount }]` using the raw material IDs hardcoded in `lib/skewer-config.ts` (`KOFTA_RM_ID`, `SHEESH_RM_ID`).

### `lib/order-events.ts`
Module-level SSE broadcast/subscribe using a global `Set<ReadableStreamDefaultController>`. Survives Next.js hot-reload via `global.__orderEventControllers`.

- `subscribeToOrderEvents(ctrl)` — adds controller, returns cleanup function.
- `broadcastOrderEvent(type, data)` — encodes `data: {...}\n\n` and enqueues to all active controllers. Dead controllers are pruned on write error.

### `lib/sides-config.ts`
Central config for the sides system. See the previous HANDOVER.md for the full breakdown — this file was not changed in this session, only created in the prior session.

### `lib/skewer-config.ts`
- `KOFTA_RM_ID` / `SHEESH_RM_ID` — hardcoded Prisma cuid values for the two raw materials.
- `SKEWER_TYPES` — `['Kofta', 'Sheesh']` as const.
- `isSkewerItem(name)` — returns true if name matches `/skewers?\s*-\s*\d/i`.
- `getSkewerCount(name)` — extracts the number from names like "3 Skewers - Mixed".

---

## 5. Changed Existing Frontend Files

### `app/(app)/sell/page.tsx`

**Cart keyed by UUID**: All cart operations now key on `CartItem.id` (a `crypto.randomUUID()` generated at add-time), not `menuItemId`. This allows the same menu item to appear multiple times with different sides/skewers.

**Sides flow**:
- `addToCart(item)` checks the item's category name against `SIDES_CATEGORY_NAMES` — side items (Salads, Carbs, Sauces) are added directly to cart without a modal.
- Everything else opens the appropriate modal: skewer items open `SkewerModal` first, then `SidesModal`; sandwich items open `SidesModal` in sandwich mode; regular items open `SidesModal` in regular mode.

**Skewer flow**:
- If `isSkewerItem(item.name)` → `setPendingSkewer(item)` → `SkewerModal` appears.
- On confirm: `confirmSkewerSelection(item, selection)` stores the selection in `pendingSkewerSelection`, then opens `SidesModal` for the same item.
- The selection's `deductions` array is stored on the `CartItem` as `skewerDeductions` and forwarded to the order API.

**`confirmAddToCart`**:
Calculates price adjustment (fries deduction + extras charge), builds the cart entry including `sides`, `skewers`, and `skewerDeductions`.

**Order serialisation**:
`skewers` → `Skewers: Kofta, Kofta, Sheesh` in item notes.
`sides` → `Sides: Dakwa Salad (small), Mashed Potatoes (small)` in item notes (size derived from `getSideSize(item.name)`).
`skewerDeductions` forwarded directly to the API.
Price adjustments shown correctly for negative values (fries deduction).

**Reprint**:
`lastOrder` state holds the most recent submitted order. Two "Reprint" buttons appear after an order is placed — one for customer receipt, one for kitchen receipt. Clicking opens a `Modal` with the relevant receipt component. Cart is cleared and menu is refetched after each successful order.

**No redirect**: Previously redirected to `/orders` after submit. Now stays on the sell screen.

### `app/(app)/dashboard/page.tsx`

Fetches `/api/reports/sales-chart` in parallel with stats and orders. Renders `SalesLineChart` and `CategoryBarChart` in a 2-column grid below the stats cards when data is available.

### `app/(app)/settings/page.tsx`

Replaced a stub with a 6-tab settings hub using `useTabs`. Tabs: Business, Payments, Receipt, Categories, Hours, Promotions. Each tab renders the corresponding settings component inside a card.

### `components/pos/cart.tsx`

**UUID keys**: All item callbacks (`onRemoveItem`, `onUpdateQuantity`, `onUpdateNotes`, `onUpdateTakeaway`, `onUpdatePrice`) now receive and use `item.id` (UUID), not `item.menuItemId`. Cart list `key` is also `item.id`.

**Sides and skewers display**: Skewer selections shown in amber bold text below item name. Sides shown in muted text below skewers.

**Price adjustment color**: Negative adjustments shown in green, positive in amber.

**Promotion auto-apply**: When checkout panel opens (`showCheckout === true`) and subtotal > 0, fetches `POST /api/promotions/applicable`. If promotions are returned and no manual discount has been set, auto-applies the first one and shows its name. Clears the applied promotion when cart is cleared.

### `components/pos/menu-grid.tsx`

**Stock badge**: Each item tile now has a stock badge bottom-left showing the `item.stock` count (number of portions or units remaining today). Color: green (>10), yellow (5–10), red (<5). The badge is absent if `stock` is null (no tracking).

**Out-of-stock state**: If `stock === 0`, the tile is grayed out, `cursor-not-allowed`, `opacity-50`, the `+` button turns gray, and `onClick` is blocked. The featured badge is hidden for out-of-stock items.

### `components/manage/order-management.tsx`

**PENDING status**: Added `statusVariant('PENDING') = 'warning'` and `statusLabel` helper.

**Item void**: MANAGER and ADMIN users see a trash icon on each order item in pending orders. Clicking opens a confirmation modal with an optional reason field. On confirm, calls `DELETE /api/orders/[id]/items/[itemId]`. The updated order replaces the old one in local state (no refetch).

Role check: `session?.user?.role === 'MANAGER' || 'ADMIN'` via `useSession`.

**Optimistic update on status change**: After `PATCH /api/orders/[id]/status`, response is parsed and `setOrders(prev => prev.map(...))` replaces the order in local state instead of calling `fetchOrders()` again.

**Removed**: `DropdownMenu`, `IconButton` for status changes (now uses direct buttons for Pending → Complete/Cancel).

### `components/manage/stock-management.tsx`

Complete rewrite. The old component tracked raw material movements (IN/OUT/WASTE/ADJUSTMENT). The new component has two tabs:

**Items tab** — shows today's `DailyItemStockSnapshot` rows. Staff can record waste and view opening/projected/current stock per menu item. Open and close buttons per item.

**Pools tab** — shows today's `RawMaterialDailyStock` rows. Shows raw material opening stock, current stock (after order deductions), and how many portions of each recipe item can be made. Used to track shared ingredient pools (e.g. a shared meat pool used across multiple skewer items).

### `components/manage/material-management.tsx`

When creating a new material purchase category, a dropdown now lets the user optionally link it to a raw material (`rawMaterialId`). This dropdown is populated from `GET /api/stock/materials`. The selected link is stored on the category and used by `POST /api/materials` to auto-increment the raw material's stock on each purchase entry.

### `components/receipts/customer-receipt.tsx`

**Dynamic settings**: Fetches `GET /api/settings` on mount. All previously hardcoded values (restaurant name, MoMo merchant ID, USSD number, feedback URL, receipt footer, QR toggle) are now live from the DB.

**Feedback QR**: If `showReceiptQR` is true, generates a second QR code from `feedbackUrl` and renders it alongside the MoMo QR (or alone if payment is not MoMo).

**MoMo QR**: Only generated if `paymentMethod === 'MOMO' && showReceiptQR`. Merchant ID taken from settings.

### `components/receipts/kitchen-receipt.tsx`

**`parseItemNotes(notes)`**: Splits a serialised notes string into four parts:
- `skewers` — content after `Skewers:` prefix
- `sides` — content after `Sides:` prefix
- `takeaway` — content of `[TAKEAWAY...]` bracket
- `userNotes` — everything remaining after stripping the above

Price adjustment brackets `[Price ...]` are stripped from kitchen output (price info is not relevant to kitchen staff).

**`aggregateSkewers(str)`**: Counts occurrences of each skewer type and formats as `2x Kofta, 1x Sheesh`.

Kitchen output for an item with notes now shows labeled sections: **SKEWERS** (aggregated), **SIDES** (as written), takeaway flag in bold, then free-text notes. Previously all notes were shown as a single "⚠ SPECIAL: ..." line.

**Print fix**: Changed `position: absolute` → `position: fixed` on the print receipt wrapper so it always prints from the top-left corner regardless of scroll position.

### `components/payments/momo-payment.tsx`

Fetches `GET /api/settings` before generating payment codes. Stores `momoMerchantId` and `momoUssdNumber` in refs. Both the QR code payload and the USSD string use the live values from settings.

USSD format corrected from `*182*7*1*...` to `*182*8*1*{ussdNumber}*{amount}#`.

### `components/layout/sidebar.tsx`

Added a **Reports** nav entry (`/reports`, `BarChart2` icon) between Stock and Expenses. Visible to ADMIN and MANAGER.

### `lib/utils.ts`

`formatPrice` now uses a module-level cached `Intl.NumberFormat` instance instead of creating a new one on every call.

### `types/index.ts`

- `MenuItemWithStock` = `MenuItem & { stock: number | null }` — used by `CategoryWithItems.items`.
- `CategoryWithItems.items` changed from `MenuItem[]` to `MenuItemWithStock[]`.
- `CartItem` gains: `sides?: string[]`, `skewers?: string[]`, `skewerDeductions?: Array<{ rawMaterialId: string; amount: number }>`.
- `Promotion` type added (mirrors the DB model, dates as strings).
- `PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y_FREE'`.
- `OrderStatus` gains `'PENDING'`.

---

## 6. Key Invariants to Know

**Order lifecycle**: `PENDING → COMPLETED` (sets `completedAt`) or `PENDING → CANCELLED` (refunds payments, restores stock). `COMPLETED` is terminal — no transitions out. Orders should not linger in PENDING; the kitchen display drives them to completion.

**Stock deduction on order create**: Happens outside the order creation transaction (best-effort). If it fails, the order is still created. The deduction is fire-and-forget per pool/snapshot row — there is no rollback if partial.

**Recipe vs. snapshot items**: An item is a recipe item if it has at least one `RawMaterialUsage` row. Recipe items deduct from `RawMaterialDailyStock` pools; all others deduct from `DailyItemStockSnapshot`. Skewer items override recipe lookup with explicit per-order deductions.

**Skewer RM IDs are hardcoded**: `lib/skewer-config.ts` contains the actual Prisma cuid values for Kofta and Sheesh raw materials. If those materials are deleted and recreated, the IDs must be updated in that file.

**BusinessSettings is a singleton**: Always `id = 'singleton'`. The GET endpoint uses `upsert` so it always returns a row. Never create a second row.

**Promotions time check uses Rwanda time (UTC+2)**: The applicable endpoint converts UTC to Rwanda local time for the `startTime`/`endTime` comparison and handles midnight rollover.

---

## Session 2 Changes — Pool Stock Convert & Day-Close Flow

### Overview

Pool stock (shared raw material pools used by recipe items) previously had no day-close mechanism — there was no way to record waste or sold quantities for raw materials, and the next day's opening always started blank. This session added:

1. A **Convert** button that turns raw material quantities into per-item opening stock entries for every recipe item variant.
2. A **pool closing flow** — Sold (editable, pre-filled from order deductions) and Waste (editable, in raw material units) columns appear at close time; closing stock is computed and saved.
3. **Previous-day carry-forward** — pool opening inputs pre-fill from yesterday's closing stock, and a LS (last session) column shows the previous day's value.

---

### Schema Changes

**`RawMaterialDailyStock`** — four new fields:

```
wasteQuantity Float    @default(0)   — raw material units wasted at close
closingStock  Float?                 — openingStock − soldQty − wasteQty
closedAt      DateTime?
closedById    String?   — FK → User (relation "PoolStockCloser")
```

**`User`** — new reverse relation:

```
closedPoolStocks RawMaterialDailyStock[] @relation("PoolStockCloser")
```

Migration applied via `npx prisma db push`.

---

### New API Route

**`POST /api/stock/pools/close`**

Body: `{ date?, materials: [{ rawMaterialId, soldQuantity, wasteQuantity }] }`

For each material, fetches today's `RawMaterialDailyStock`, computes:

```
closingStock = max(0, openingStock − soldQuantity − wasteQuantity)
```

Saves `wasteQuantity`, `closingStock`, `closedAt`, `closedById`. Skips silently if no record exists for that date. Requires ADMIN or MANAGER role.

---

### Changed API Routes

**`GET /api/stock/pools`**

- Runs a second query for `yesterday`'s `RawMaterialDailyStock` (same raw material IDs) and returns `lastClosingStock` per pool row.
- Returns `wasteQuantity` and `closingStock` from today's record.
- Adds `categoryName` (from `menuItem.category.name`) to each menu item inside `pool.menuItems` — needed so the UI can group converted recipe items by category without an extra fetch.
- Returns two new top-level booleans: `isClosed` (`true` when all opened pools have a `closingStock`).

**`GET /api/stock/items`**

Previously filtered `rawMaterialUsage: { none: {} }` — only non-recipe items. Now also queries recipe items (`rawMaterialUsage: { some: {} }`) that have a `DailyItemStockSnapshot` for today (i.e. items that were explicitly converted and opened). Both lists are merged and deduplicated by `menuItemId` before mapping. `hasRecipe: true` is set correctly for converted recipe items.

**`POST /api/stock/items/open`**

- Removed the "already confirmed for this date" early-return guard — the upsert is now idempotent without it.
- Removed the recipe item exclusion filter that previously stripped any item with a `RawMaterialUsage` row. Recipe items can now be saved as `DailyItemStockSnapshot` entries (this is what drives the per-item view after Convert).

**`POST /api/stock/items/close`**

- Removed the "already closed for this date" guard — allows Edit Closing to re-save without a 400 error.

---

### Changed Frontend File

**`components/manage/stock-management.tsx`** — full rewrite of the stock workflow component.

#### New state

| State | Type | Purpose |
|-------|------|---------|
| `showConvertedRecipeItems` | `boolean` | Whether the per-item section should render recipe items (set `true` by Convert, `true` on Edit Opening when snapshots already exist) |
| `poolSoldEdits` | `Record<string, string>` | Editable sold quantity per raw material during closing phase |
| `poolWasteEdits` | `Record<string, string>` | Editable waste quantity per raw material during closing phase |

#### New handler: `handleConvert`

For each pool, reads the pool quantity from `poolEdits` (new opening) or `pool.openingStock` (already set, edit mode). For each linked menu item, computes `floor(poolQty / portionSize)`. When a menu item appears in multiple pools, takes the minimum count across all pools. Writes all counts into `openEdits` (keyed by `menuItemId`) and sets `showConvertedRecipeItems = true`.

#### `handleOpenStock` change

Pool `poolEdits` now pre-fill from `pool.lastClosingStock` when `pool.openingStock` is `null` (fresh day). Falls back to empty string if no previous day exists.

#### `handleConfirmOpening` changes

- Pool materials are only POSTed if `p.openingStock === null` — pools are immutable once set; editing opening re-saves only per-item snapshots.
- Includes converted recipe items (from `recipeItemsForOpening`) alongside `itemData.items` in the items payload, deduplicating by `menuItemId`.

#### `handleCloseStock` and `handleEditClosing` changes

Both now initialise `poolSoldEdits` (pre-filled as `openingStock − currentStock`) and `poolWasteEdits` (from stored `pool.wasteQuantity`). Edit Closing additionally derives sold from `openingStock − closingStock − wasteQuantity` (the stored values).

#### `handleConfirmClosing` change

Now POSTs to **both** `/api/stock/items/close` and `/api/stock/pools/close` in parallel. Pool materials filtered to those with `openingStock !== null`. Waste for recipe items is forced to `0` in the items payload — waste is recorded at pool level only.

#### `derivePhase` change

Updated to use both item and pool closing state:

```
itemsClosed = !hasItems || isCloseConfirmed (from item snapshots)
poolsClosed = !hasPools || isClosed (from pool GET)
phase = 'closed' if isOpen && itemsClosed && poolsClosed
```

#### Pool section (`PoolSection` component)

**Opening phase**: Added LS column showing `pool.lastClosingStock`. Already-set pools show their value as read-only with "(locked)" label — they cannot be re-saved. New **Convert** button in the section header, disabled until at least one pool has a quantity.

**Open-confirmed phase**: Unchanged — shows Remaining / Set and Portions Available.

**Closing phase**: Three new columns replace the old read-only display:
- **Sold** — editable `Input` (step `0.01`), pre-filled from `openingStock − currentStock`
- **Waste** — editable `Input` (step `0.01`), in raw material units
- **Closing** — live calculation: `max(0, openingStock − sold − waste)`

**Closed phase**: Same columns as closing but read-only. Sold is derived as `openingStock − closingStock − wasteQuantity`.

#### Per-item section (`PerItemSection` component)

**Opening phase**: Accepts an additional `recipeItemsForOpening` list (derived from pool menu items, deduplicated). These rows appear in the per-item table interleaved by category. A small "pool item" label appears below the item name so staff can distinguish them.

**Closing phase**: For items where `hasRecipe === true`, the Waste cell shows "— (pool)" instead of an editable input. Closing is calculated as `opening − sold` (waste excluded at item level; it is already recorded at pool level).

#### `recipeItemsForOpening` memo

Derived from `poolData.pools[].menuItems[]`, deduplicated by `menuItemId`. Only populated when `showConvertedRecipeItems` is true. Each entry is shaped as an `ItemStockRow` with `hasRecipe: true` and all stock fields null.

---

### Invariants Added

**Pool stock is immutable once opened**: The `POST /api/stock/pools` route still rejects if a record already exists for that date. Edit Opening re-enters the opening phase but skips the pool POST entirely (`p.openingStock === null` filter). Only per-item snapshot values can be changed after initial opening.

**Pool waste is raw-unit only**: Waste for recipe-based portions is recorded at the raw material level (e.g. "0.5 whole chicken wasted"), not per portion variant. Per-item closing for recipe items uses `opening − sold` with waste forced to zero.

**Closing stock formula for pools**: `max(0, openingStock − soldQuantity − wasteQuantity)` — uses the user-entered sold value, not the live `currentStock`. This lets staff correct discrepancies between the system's order tally and the actual number served.

**Day-close requires both sides**: `derivePhase` returns `'closed'` only when item snapshots AND pool records are both closed (or absent). Confirming closing POSTs to both endpoints in parallel; if either fails the toast shows the error and the phase stays on `'closing'`.
