# BDM Delivery Assist (DA) — API Reference

For the delivery-agent mobile app + admin panel. Backend is Django REST Framework with JWT auth.

- **Base URL (production):** `https://api.bdmpharmacy.store`
- **Base URL (dev):** `http://127.0.0.1:8009`
- All request/response bodies are JSON. Send `Content-Type: application/json`.

---

## 1. Authentication

### Login
`POST /auth/login/`
```json
{ "phone": "0190000001", "password": "secret" }
```
**200**
```json
{
  "status": "success",
  "access_token": "<JWT>",
  "data": { "user_id": 12, "full_name": "Agent A", "phone": "0190000001", "role": "delivery_man", "area": 3, "area_name": "Zone A", "is_approved": true, ... }
}
```
- Send the token on every other request: `Authorization: Bearer <access_token>`.
- Token lifetime: **10 days** (no refresh endpoint is used; re-login when expired).
- The agent account must have `is_approved = true` and `role = "delivery_man"`, otherwise login/410 or 403 on delivery endpoints.

**Errors:** `400` missing fields · `401` invalid credentials / not approved.

---

## 2. Conventions

- **Auth:** all endpoints below require the `Authorization: Bearer <token>` header.
- **Envelope:** non-paginated responses look like `{ "status": "success", "data": {...} }`. Errors: `{ "status": "error", "message": "..." }`.
- **Pagination (list endpoints):** DRF page format — the envelope is nested inside `results`:
```json
{
  "count": 53,
  "next": "https://.../?page=2",
  "previous": null,
  "results": { "status": "success", "data": [ ... ] }
}
```
  Query params: `?page=<n>` and `?page_size=<n>` (default 20, max 200).
- **Roles:** agent endpoints require `role = delivery_man`; admin endpoints require `is_staff` or `is_superuser`. Wrong role → `403`.
- All amounts are numbers in BDT.

---

## 3. Delivery Agent endpoints

### 3.1 Dashboard
`GET /delivery/dashboard/`
```json
{
  "status": "success",
  "data": {
    "total_assigned": 12,
    "pending_deliveries": 4,
    "delivered_total": 8,
    "delivered_today": 3,
    "outstanding_dues": 1250.0,
    "returned_products": 5,
    "today_collection": 8600.0,
    "undeposited_amount": 8600.0,
    "pending_deposit_amount": 0.0,
    "cash_in_hand": 8600.0
  }
}
```

### 3.2 My orders
`GET /delivery/orders/?status=pending` — `status` = `pending` (ready to deliver), `delivered`, or omit for all assigned. Paginated.
```json
"data": [
  {
    "order_id": 3201,
    "invoice_number": "INV-20260615-3753",
    "shop_name": "ma pharmecy",
    "customer_name": "Md Sharif",
    "phone": "0170000001",
    "address": "Uttar Khan, Dhaka",
    "area": "Zone A",
    "invoice_amount": 3051.18,
    "collected_amount": 0.0,
    "due_amount": 3051.18,
    "payment_status": "Due",
    "delivery_status": "shipped",
    "order_date": "2026-06-15T10:00:00"
  }
]
```
`payment_status` ∈ `Paid | Partial | Due`. `delivery_status` ∈ `shipped | delivered | …`.

### 3.2b Order detail — **with line items** (use this for returns/editing)
`GET /delivery/orders/<order_id>/` — full detail of one of the agent's assigned orders, **including `items[]`**. The app calls this to know what's deliverable/returnable before submitting a return request.
```json
{
  "status": "success",
  "data": {
    "order_id": 3201, "invoice_number": "INV-...", "shop_name": "...", "customer_name": "...",
    "invoice_amount": 3051.18, "collected_amount": 0.0, "due_amount": 3051.18,
    "payment_status": "Due", "delivery_status": "shipped",
    "items": [
      { "product": 220, "product_name": "Napa 500mg", "quantity": 3, "unit_price": 8.5, "mrp": 10, "discount_percent": 15, "line_total": 25.5 }
    ]
  }
}
```
`404` if the order isn't assigned to this agent. **The `items[].product` id + `quantity` are exactly what you send back in the return request (3.7).**

### 3.3 Mark delivered (+ optional collection)
`POST /delivery/orders/<order_id>/deliver/`
```json
{ "amount": 3051.18 }   // optional — cash collected at delivery; omit/0 to deliver without collecting
```
**200** → returns the updated order (same shape as 3.2).
**Errors:** `404` not your order / not found · `400` order not in `shipped` status · `400` invalid amount.

### 3.4 Collect a payment (dues / partial, anytime)
`POST /delivery/orders/<order_id>/collect/`
```json
{ "amount": 500, "note": "Due collection" }
```
- Works whether or not the order is already delivered (for collecting earlier dues).
- **200** → updated order. `400` if amount ≤ 0. `404` if not the agent's order.

### 3.5 Payment lookup (by invoice)
`GET /delivery/payment/?invoice=INV-20260615-3753`
```json
{
  "status": "success",
  "data": {
    "order_id": 3201, "invoice_number": "INV-20260615-3753",
    "shop_name": "ma pharmecy", "customer_name": "Md Sharif", "phone": "...",
    "invoice_amount": 3051.18,
    "previous_due": 3051.18,
    "total_collectable": 3051.18
  }
}
```
`404` if the invoice isn't assigned to this agent.

### 3.6 Customer dues
`GET /delivery/dues/` — agent's invoices with an outstanding due. Paginated; `results.total_due` is the sum.
```json
"results": { "status": "success", "total_due": 1250.0, "data": [ { order rows, due_amount > 0 } ] }
```

### 3.7 Product return (request → staff confirms)
`POST /delivery/orders/<order_id>/return/`
```json
{ "items": [ { "product": 220, "quantity": 2, "reason": "damaged" } ], "note": "end of day" }
```
- Submits a **pending return request** — **nothing is applied yet** (stock is NOT restored, order total unchanged). Staff confirm it in the admin panel after physically receiving the goods; only then is stock restored and the order adjusted.
- `product` must be a line on the order; `quantity` ≤ ordered qty.
- **201** → the created return request (`status: "pending"`, with `items`). `400` invalid item / over-quantity / product not on order. `404` not the agent's order.

### 3.7b Returns via the order-update API (role-based)
Returns can also be managed through the standard order-update endpoint, which behaves **by role**:

`PATCH /orders/orders/<order_id>/` with the **desired remaining items** (same shape as an admin order edit):
```json
{ "items": [ { "product": 220, "quantity": 3 } ], "reason": "damaged", "note": "end of day" }
```
- **Delivery agent** (their assigned order): each reduced/removed line becomes a **pending return request** → **201** with the request (order is *not* changed yet; admin confirms later). Agents may only **reduce** lines — adding products or increasing qty → `400`.
- **Admin/staff**: reductions are **applied immediately** (auto-approval — stock restored, totals adjusted) → **200** with the updated order.

So the app can either send the items-to-return to `POST …/return/` (3.7) **or** send the updated item list to `PATCH /orders/orders/<id>/` — both create a pending request for agents.

### 3.8 My return requests
`GET /delivery/return-requests/?status=pending|confirmed|rejected` (paginated) — the agent's own return requests with their status.

### 3.9 Deposits (cash settlement)
**History:** `GET /delivery/deposits/?status=pending|approved|rejected` (paginated)
```json
"results": {
  "status": "success",
  "cash_in_hand": 8600.0,
  "undeposited_amount": 8600.0,
  "data": [
    { "id": 7, "amount": 8600.0, "status": "pending", "requested_at": "...", "reviewed_at": null, "payment_count": 14 }
  ]
}
```
**Submit:** `POST /delivery/deposits/` (no body needed — auto-covers ALL undeposited cash)
```json
{ "note": "End of day" }   // optional
```
**201** → the created deposit (`status: "pending"`). `400` if there's no undeposited cash.

---

## 4. Admin endpoints (web panel — `is_staff`/`is_superuser`)

### 4.1 Deposit review queue
`GET /delivery/admin/deposits/?status=pending&delivery_man=<id>` (both filters optional; paginated)
Each row: `id, delivery_man, delivery_man_name, amount, status, note, requested_at, reviewed_by, reviewed_by_name, reviewed_at, review_note, payment_count`.

### 4.2 Approve / reject
`POST /delivery/admin/deposits/<id>/approve/`
`POST /delivery/admin/deposits/<id>/reject/`  body: `{ "note": "short by 200" }` (optional)
- Approve → settles the agent's cash. Reject → releases the collections back to the agent's undeposited pool (re-submittable).
- `400` if the deposit isn't `pending`. `403` if caller isn't admin.

### 4.3 Return-request review (confirm restores stock)
- `GET /delivery/admin/return-requests/?status=pending&delivery_man=<id>` — review queue (paginated); each row includes `items[]`, `total_quantity`, `total_value`.
- `POST /delivery/admin/return-requests/<id>/confirm/` — **confirm**: restores stock to current product qty, adjusts the order total/due, records the return. `400` if not pending or an order line changed.
- `POST /delivery/admin/return-requests/<id>/reject/` body `{ "note": "not received" }` — reject; applies nothing.

### 4.4 Order assignment
Orders auto-assign to an area agent when an admin sets an order to **`shipped`**. Manage manually via:
- `GET /delivery/admin/agents/` — delivery agents with `area_name` + `pending_deliveries` load.
- `GET /delivery/admin/orders/?assigned=unassigned|assigned&status=shipped&area=<id>` — orders for the assignment screen (paginated).
- `POST /delivery/admin/orders/<id>/assign/` body `{ "delivery_man": <user_id> }` — (re)assign.

(Order detail/list also include `assigned_to` and `assigned_to_name`.)

---

## 5. Admin dashboard-sync reports (`is_staff`/`is_superuser`)

All under `GET /reports/<name>/`, return `{ "status": "success", "summary": {...}, ...breakdowns }`. **All four delivery reports accept an optional date period:** `?from_datetime=YYYY-MM-DDTHH:MM:SS&to_datetime=...`.

| Report | URL | Date filters on | Returns |
|---|---|---|---|
| Collections | `/reports/collection_summary/` | payment date | `summary.today_collection`, `summary.total_collection`, `by_delivery_man[]`, `by_customer[]` |
| Returns | `/reports/returns_summary/` | return date | `summary.total_quantity/total_value`, `by_product[]`, `by_reason[]`, `by_delivery_man[]` |
| Dues | `/reports/due_summary/` | order date (customer) / collection date (agent) | `summary`, `customer_dues[]`, `delivery_man_dues[]` |
| Delivery | `/reports/delivery_performance/` | order date | `summary` (assigned/delivered/pending/success_rate), `by_delivery_man[]` |
| Customer Balance | `/reports/customer_balance/` | order date | per-customer `total_order_amount`, `total_collected`, `total_due`, `order_count` |
| (list) | `/reports/` | — | available reports for the current user |

**Customer Balance** — `GET /reports/customer_balance/?customer=<user_id>` (optional). Returns each customer's totals; `summary` has the grand totals. Admin/staff see all customers; a regular customer sees only their own row (so the customer app can show "my total orders / my total due").
```json
{
  "status": "success",
  "summary": { "customers": 80, "order_count": 589, "total_order_amount": 1251961.43, "total_collected": 900000.0, "total_due": 351961.43 },
  "data": [
    { "customer": 12, "name": "Md Sharif", "shop_name": "ma pharmecy", "phone": "0170...", "order_count": 31, "total_order_amount": 44842.32, "total_collected": 30000.0, "total_due": 14842.32 }
  ]
}
```

---

## 6. Business rules the app should respect

1. **Status flow:** an agent only acts on orders in `shipped` status (their "pending deliveries") and moves them to `delivered`. Agents cannot change status otherwise.
2. **Collection ledger:** `collected_amount` and `due_amount` on an order are server-maintained; the app just posts collection amounts. `due_amount = invoice_amount(final) − collected_amount`.
3. **Cash-in-hand = undeposited + pending** (cash physically held until a deposit is **approved**). Submitting a deposit sweeps all undeposited cash into one pending request.
4. **Deposit rejection** returns that cash to the undeposited pool — it will be included in the next submission.
5. **Returns** reduce the invoice total and the due immediately.
6. **Auth/role:** the same login serves all roles; the app should check `data.role === "delivery_man"` after login and require `is_approved`.

---

## 7. Quick test sequence (agent)
1. `POST /auth/login/` → token.
2. `GET /delivery/dashboard/` and `GET /delivery/orders/?status=pending`.
3. `POST /delivery/orders/<id>/deliver/ {amount}` → delivered + collected.
4. `GET /delivery/dues/` → remaining dues; `POST /delivery/orders/<id>/collect/ {amount}` later.
5. End of day: `POST /delivery/deposits/` → admin approves at `/delivery/admin/deposits/<id>/approve/`.
