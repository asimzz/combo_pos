# Planned Features

Features not yet implemented, grouped by area. Priority is rough — high means immediate value, low means nice-to-have.

---

## POS / Sell

### 86 toggle from sell screen (high)
A manager should be able to mark a menu item as sold out directly from the POS grid without opening Catalog. A small badge on the item tile would show it as unavailable, and tapping it would be blocked. Resets automatically at day open or manually. Note: items currently go disabled when stock hits 0, but there is no manual override toggle from the sell screen.

### Split payment (medium)
Allow an order to be paid partly in cash and partly in MoMo. The order submission currently accepts a single payment method. Would require splitting the `Payment` records and updating the order confirmation flow.

### Order scheduling / pre-orders (low)
Accept a future pick-up time for an order. Store a `scheduledFor` datetime on `Order` and surface it on the kitchen receipt and order list.

---

## Orders & Kitchen

### Reprint from order list (medium)
A reprint button on any completed order in the order management list. Currently reprint only works from the sell screen immediately after an order (via `reprintType` state). There is no way to reprint a historical order from the order management view.

---

## Dashboard & Reporting

### Tax report (medium)
A dedicated tax summary: tax collected per day/week/month, broken down by tax rate. Needed for compliance.

---

## Stock & Inventory

### Low-stock alerts (high)
Define a minimum stock threshold per raw material. When stock falls below the threshold after a day-open deduction, show a banner on the dashboard and the stock page. No external notifications needed — just an in-app flag. No schema field for threshold exists yet.

### Supplier directory (medium)
A simple supplier list (name, phone, email, notes) linked to `DebtEntry`. Currently debts only store a supplier name string with no structured contact. Would allow filtering debt by supplier and contacting them directly.

### Purchase order workflow (low)
Formalise material purchases: create a PO with expected items and quantities, mark it as received, and auto-update raw material stock. Currently stock is updated manually through material entries.

---

## Customers & Loyalty

### Customer profiles (medium)
Build a customer directory from the `customerPhone` / `customerName` already stored on orders. Show order history, total spend, and average order value per customer. No new schema field needed — just an aggregation view.

### Customer loyalty / points (low)
Award points per RWF spent and allow redeeming points for a discount on a future order. Would require a `LoyaltyAccount` model and a redemption flow in the POS.

---

## Settings & Configuration

### Menu item image upload (medium)
The `image` field already exists on `MenuItem` but there is no upload UI. Add a file input in Catalog that uploads to local storage or an S3-compatible bucket and saves the URL. Surface the image in the POS grid.

### Role-level permissions (low)
Currently roles are hard-coded as ADMIN / MANAGER / STAFF with fixed access rules. A permissions matrix in Settings would let admins grant MANAGER access to specific ADMIN features (e.g., viewing Books) without full admin rights.

---

## Shift & Cash Management

### Shift open / close with cash count (high)
At start of shift, record the opening float (cash in drawer). At end of shift, count cash and compare against expected (opening float + cash sales − any cash-outs). Surface a reconciliation summary showing over/under. No schema exists for this yet — needs a `ShiftSession` model.

### Cash-out / petty cash (medium)
Record small cash withdrawals from the drawer during a shift (e.g., buying supplies). Linked to a shift session and subtracted from the expected closing balance.

---

## Infrastructure & UX

### Offline / PWA mode (low)
Allow the POS sell screen to queue orders when the network drops and sync them when connectivity returns. Complex to implement correctly — only worth it if connectivity is genuinely unreliable at the deployment site.

### Push / toast notifications for new inbox messages (medium)
When the AI inbox receives a new customer message, show an in-app notification badge on the Inbox nav item and optionally a browser push notification. SSE is already in place — just needs a subscriber in the shell layout.

### Keyboard shortcuts on POS (low)
Power-user shortcuts: number keys to select categories, arrow keys to navigate menu items, Enter to add to cart. Would significantly speed up high-volume service.
