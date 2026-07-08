from decimal import Decimal

from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import UserAuth, District, Area
from orders.models import Order, OrderItem, ReturnItem
from products.models import Product
from orders.services import recalculate_order_totals
from delivery.models import CollectionPayment, DepositRequest
from delivery.services import assign_order_by_area, set_collected_total


class DeliveryPhase2Tests(APITestCase):
    def setUp(self):
        self.district = District.objects.create(name="Dhaka")
        self.area_a = Area.objects.create(area_name="Zone A", district=self.district)
        self.area_b = Area.objects.create(area_name="Zone B", district=self.district)

        self.agent = UserAuth.objects.create_user(
            phone="0190000001", password="pass", full_name="Agent A",
            email="a@x.com", role="delivery_man", area=self.area_a, is_active=True,
        )
        self.other_agent = UserAuth.objects.create_user(
            phone="0190000002", password="pass", full_name="Agent B",
            email="b@x.com", role="delivery_man", area=self.area_b, is_active=True,
        )
        self.customer = UserAuth.objects.create_user(
            phone="0170000001", password="pass", full_name="Customer",
            email="c@x.com", role="customer", area=self.area_a, is_active=True,
        )

    def _order(self, total, order_status="shipped", assigned=None):
        o = Order.objects.create(
            user_id=self.customer, order_status=order_status,
            total_amount=Decimal(str(total)), delivery_charge=0,
        )
        if assigned is not None:
            o.assigned_to = assigned
            o.save()
        return o

    # ---- auto-assignment ----
    def test_auto_assign_picks_area_agent(self):
        o = self._order(1000, order_status="pending")
        assign_order_by_area(o)
        o.refresh_from_db()
        self.assertEqual(o.assigned_to_id, self.agent.user_id)

    def test_auto_assign_least_loaded(self):
        # second agent in the same area, already carrying one pending delivery
        busy = UserAuth.objects.create_user(
            phone="0190000003", password="pass", full_name="Agent C",
            email="cc@x.com", role="delivery_man", area=self.area_a, is_active=True,
        )
        Order.objects.create(user_id=self.customer, order_status="shipped",
                             total_amount=Decimal("10"), delivery_charge=0, assigned_to=busy)
        o = self._order(500, order_status="pending")
        assign_order_by_area(o)
        o.refresh_from_db()
        self.assertEqual(o.assigned_to_id, self.agent.user_id)  # the idle one

    # ---- order list scoping ----
    def test_order_list_only_mine(self):
        mine = self._order(100, assigned=self.agent)
        self._order(200, assigned=self.other_agent)
        self.client.force_authenticate(self.agent)
        res = self.client.get("/delivery/orders/?status=pending")
        self.assertEqual(res.status_code, 200)
        rows = res.data["results"]["data"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["invoice_number"], mine.invoice_number)
        self.assertEqual(rows[0]["payment_status"], "Due")

    # ---- deliver + collect ----
    def test_deliver_with_collection(self):
        o = self._order(1000, assigned=self.agent)
        self.client.force_authenticate(self.agent)
        res = self.client.post(f"/delivery/orders/{o.order_id}/deliver/", {"amount": "600"})
        self.assertEqual(res.status_code, 200)
        o.refresh_from_db()
        self.assertEqual(o.order_status, "delivered")
        self.assertEqual(float(o.collected_amount), 600.0)
        self.assertEqual(float(o.due_amount), 400.0)
        self.assertEqual(CollectionPayment.objects.filter(order=o).count(), 1)

    def test_collect_due_later(self):
        o = self._order(1000, order_status="delivered", assigned=self.agent)
        set_collected_total(o, 600)  # simulate prior partial collection
        self.client.force_authenticate(self.agent)
        res = self.client.post(f"/delivery/orders/{o.order_id}/collect/", {"amount": "400"})
        self.assertEqual(res.status_code, 200)
        o.refresh_from_db()
        self.assertEqual(float(o.collected_amount), 1000.0)
        self.assertEqual(float(o.due_amount), 0.0)

    def test_collect_rejects_non_positive(self):
        o = self._order(500, assigned=self.agent)
        self.client.force_authenticate(self.agent)
        res = self.client.post(f"/delivery/orders/{o.order_id}/collect/", {"amount": "0"})
        self.assertEqual(res.status_code, 400)

    # ---- payment lookup ----
    def test_payment_lookup(self):
        o = self._order(1000, assigned=self.agent)
        set_collected_total(o, 250)
        self.client.force_authenticate(self.agent)
        res = self.client.get(f"/delivery/payment/?invoice={o.invoice_number}")
        self.assertEqual(res.status_code, 200)
        data = res.data["data"]
        self.assertEqual(float(data["invoice_amount"]), 1000.0)
        self.assertEqual(float(data["previous_due"]), 750.0)
        self.assertEqual(float(data["total_collectable"]), 750.0)

    # ---- dues ----
    def test_dues_list(self):
        due_order = self._order(1000, order_status="delivered", assigned=self.agent)
        set_collected_total(due_order, 400)
        paid = self._order(500, order_status="delivered", assigned=self.agent)
        set_collected_total(paid, 500)
        self.client.force_authenticate(self.agent)
        res = self.client.get("/delivery/dues/")
        self.assertEqual(res.status_code, 200)
        rows = res.data["results"]["data"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["invoice_number"], due_order.invoice_number)
        self.assertEqual(float(res.data["results"]["total_due"]), 600.0)

    # ---- dashboard ----
    def test_dashboard_today_collection(self):
        o = self._order(1000, assigned=self.agent)
        self.client.force_authenticate(self.agent)
        self.client.post(f"/delivery/orders/{o.order_id}/deliver/", {"amount": "700"})
        res = self.client.get("/delivery/dashboard/")
        self.assertEqual(res.status_code, 200)
        d = res.data["data"]
        self.assertEqual(float(d["today_collection"]), 700.0)
        self.assertEqual(d["delivered_total"], 1)
        self.assertEqual(d["pending_deliveries"], 0)

    # ---- permissions / scoping ----
    def test_non_delivery_user_forbidden(self):
        self.client.force_authenticate(self.customer)
        res = self.client.get("/delivery/orders/")
        self.assertEqual(res.status_code, 403)

    def test_cannot_deliver_others_order(self):
        o = self._order(100, assigned=self.other_agent)
        self.client.force_authenticate(self.agent)
        res = self.client.post(f"/delivery/orders/{o.order_id}/deliver/", {})
        self.assertEqual(res.status_code, 404)

    def test_cannot_deliver_non_shipped(self):
        o = self._order(100, order_status="pending", assigned=self.agent)
        self.client.force_authenticate(self.agent)
        res = self.client.post(f"/delivery/orders/{o.order_id}/deliver/", {})
        self.assertEqual(res.status_code, 400)

    # ---- deposits / cash settlement (Phase 3) ----
    def _collect(self, total, amount):
        o = self._order(total, assigned=self.agent)
        self.client.force_authenticate(self.agent)
        self.client.post(f"/delivery/orders/{o.order_id}/deliver/", {"amount": str(amount)})
        return o

    def test_submit_deposit_covers_all_undeposited(self):
        self._collect(1000, 600)
        self._collect(500, 500)
        self.client.force_authenticate(self.agent)
        res = self.client.post("/delivery/deposits/", {})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(float(res.data["data"]["amount"]), 1100.0)
        self.assertEqual(res.data["data"]["status"], "pending")
        # all collections now linked to the deposit -> nothing left undeposited
        res2 = self.client.get("/delivery/deposits/")
        self.assertEqual(float(res2.data["results"]["undeposited_amount"]), 0.0)
        self.assertEqual(float(res2.data["results"]["cash_in_hand"]), 1100.0)  # pending still in hand

    def test_submit_deposit_nothing_to_deposit(self):
        self.client.force_authenticate(self.agent)
        res = self.client.post("/delivery/deposits/", {})
        self.assertEqual(res.status_code, 400)

    def test_admin_approve_settles_cash(self):
        self._collect(1000, 600)
        self.client.force_authenticate(self.agent)
        dep = self.client.post("/delivery/deposits/", {}).data["data"]
        admin = UserAuth.objects.create_superuser(
            phone="0150000001", password="pass", full_name="Admin", email="ad@x.com"
        )
        self.client.force_authenticate(admin)
        res = self.client.post(f"/delivery/admin/deposits/{dep['id']}/approve/", {})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["status"], "approved")
        # after approval, cash is settled
        self.client.force_authenticate(self.agent)
        d = self.client.get("/delivery/dashboard/").data["data"]
        self.assertEqual(float(d["cash_in_hand"]), 0.0)

    def test_admin_reject_releases_cash(self):
        self._collect(1000, 600)
        self.client.force_authenticate(self.agent)
        dep = self.client.post("/delivery/deposits/", {}).data["data"]
        admin = UserAuth.objects.create_superuser(
            phone="0150000002", password="pass", full_name="Admin2", email="ad2@x.com"
        )
        self.client.force_authenticate(admin)
        res = self.client.post(f"/delivery/admin/deposits/{dep['id']}/reject/", {"note": "short"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["status"], "rejected")
        # rejected cash returns to the undeposited pool, re-submittable
        self.client.force_authenticate(self.agent)
        g = self.client.get("/delivery/deposits/").data["results"]
        self.assertEqual(float(g["undeposited_amount"]), 600.0)
        res2 = self.client.post("/delivery/deposits/", {})
        self.assertEqual(res2.status_code, 201)
        self.assertEqual(float(res2.data["data"]["amount"]), 600.0)

    def test_non_admin_cannot_review(self):
        self._collect(1000, 600)
        self.client.force_authenticate(self.agent)
        dep = self.client.post("/delivery/deposits/", {}).data["data"]
        # agent tries to approve their own deposit
        res = self.client.post(f"/delivery/admin/deposits/{dep['id']}/approve/", {})
        self.assertEqual(res.status_code, 403)

    def test_double_review_blocked(self):
        self._collect(1000, 600)
        self.client.force_authenticate(self.agent)
        dep = self.client.post("/delivery/deposits/", {}).data["data"]
        admin = UserAuth.objects.create_superuser(
            phone="0150000003", password="pass", full_name="Admin3", email="ad3@x.com"
        )
        self.client.force_authenticate(admin)
        self.client.post(f"/delivery/admin/deposits/{dep['id']}/approve/", {})
        res = self.client.post(f"/delivery/admin/deposits/{dep['id']}/reject/", {})
        self.assertEqual(res.status_code, 400)

    # ---- agent returns (Phase 4) ----
    def _order_with_item(self, qty=5, price=80):
        product = Product.objects.create(
            product_name="Tab X", product_image="x.jpg", mrp=100,
            selling_price=price, cost_price=50, stock_quantity=100,
        )
        o = Order.objects.create(
            user_id=self.customer, order_status="shipped",
            delivery_charge=0, assigned_to=self.agent,
        )
        OrderItem.objects.create(order=o, product=product, quantity=qty)
        recalculate_order_totals(o)
        o.refresh_from_db()
        return o, product

    # ---- returns via the order-update API (role-based) ----
    def test_order_update_by_agent_creates_pending_return(self):
        o, product = self._order_with_item(qty=5, price=80)
        self.client.force_authenticate(self.agent)
        # agent "updates" the order to keep only 3 (return 2)
        res = self.client.patch(
            f"/orders/orders/{o.order_id}/",
            {"items": [{"product": product.product_id, "quantity": 3}]}, format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["data"]["status"], "pending")
        # order NOT mutated yet
        o.refresh_from_db(); product.refresh_from_db()
        self.assertEqual(float(o.total_amount), 400.0)
        self.assertEqual(product.stock_quantity, 100)
        from delivery.models import ReturnRequest
        rr = ReturnRequest.objects.get(order=o)
        self.assertEqual(rr.items.first().quantity, 2)

    def test_order_update_by_agent_cannot_increase(self):
        o, product = self._order_with_item(qty=2)
        self.client.force_authenticate(self.agent)
        res = self.client.patch(
            f"/orders/orders/{o.order_id}/",
            {"items": [{"product": product.product_id, "quantity": 5}]}, format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_order_update_by_admin_auto_applies_return(self):
        o, product = self._order_with_item(qty=5, price=80)
        admin = self._admin()
        self.client.force_authenticate(admin)
        res = self.client.patch(
            f"/orders/orders/{o.order_id}/",
            {"items": [{"product": product.product_id, "quantity": 3}]}, format="json",
        )
        self.assertEqual(res.status_code, 200)
        o.refresh_from_db(); product.refresh_from_db()
        self.assertEqual(float(o.total_amount), 240.0)   # applied immediately (auto)
        self.assertEqual(product.stock_quantity, 102)

    def test_agent_order_detail_has_items(self):
        o, product = self._order_with_item(qty=4, price=80)
        self.client.force_authenticate(self.agent)
        res = self.client.get(f"/delivery/orders/{o.order_id}/")
        self.assertEqual(res.status_code, 200)
        items = res.data["data"]["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["product"], product.product_id)
        self.assertEqual(items[0]["quantity"], 4)
        self.assertEqual(float(items[0]["unit_price"]), 80.0)

    def test_agent_order_detail_scoped(self):
        o, _ = self._order_with_item(qty=2)
        o.assigned_to = self.other_agent
        o.save()
        self.client.force_authenticate(self.agent)
        res = self.client.get(f"/delivery/orders/{o.order_id}/")
        self.assertEqual(res.status_code, 404)

    def test_return_request_then_confirm(self):
        o, product = self._order_with_item(qty=5, price=80)
        self.assertEqual(float(o.total_amount), 400.0)

        # 1) agent submits a return request — nothing applied yet
        self.client.force_authenticate(self.agent)
        res = self.client.post(
            f"/delivery/orders/{o.order_id}/return/",
            {"items": [{"product": product.product_id, "quantity": 2, "reason": "damaged"}]},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["data"]["status"], "pending")
        req_id = res.data["data"]["id"]
        o.refresh_from_db(); product.refresh_from_db()
        self.assertEqual(float(o.total_amount), 400.0)        # unchanged
        self.assertEqual(product.stock_quantity, 100)         # NOT restored yet
        self.assertEqual(ReturnItem.objects.filter(order=o).count(), 0)

        # 2) admin confirms — now stock restores and order adjusts
        admin = self._admin()
        self.client.force_authenticate(admin)
        res2 = self.client.post(f"/delivery/admin/return-requests/{req_id}/confirm/", {})
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.data["data"]["status"], "confirmed")
        o.refresh_from_db(); product.refresh_from_db()
        self.assertEqual(float(o.total_amount), 240.0)        # 3 left * 80
        self.assertEqual(float(o.due_amount), 240.0)
        self.assertEqual(product.stock_quantity, 102)         # restored on confirm
        ri = ReturnItem.objects.get(order=o)
        self.assertEqual(ri.quantity, 2)
        self.assertEqual(ri.created_by_id, self.agent.user_id)

    def test_return_request_reject_applies_nothing(self):
        o, product = self._order_with_item(qty=5, price=80)
        self.client.force_authenticate(self.agent)
        req_id = self.client.post(
            f"/delivery/orders/{o.order_id}/return/",
            {"items": [{"product": product.product_id, "quantity": 2}]}, format="json",
        ).data["data"]["id"]
        admin = self._admin()
        self.client.force_authenticate(admin)
        res = self.client.post(f"/delivery/admin/return-requests/{req_id}/reject/", {"note": "not received"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["data"]["status"], "rejected")
        o.refresh_from_db(); product.refresh_from_db()
        self.assertEqual(float(o.total_amount), 400.0)
        self.assertEqual(product.stock_quantity, 100)
        self.assertEqual(ReturnItem.objects.filter(order=o).count(), 0)

    def test_return_request_rejects_overqty(self):
        o, product = self._order_with_item(qty=3)
        self.client.force_authenticate(self.agent)
        res = self.client.post(
            f"/delivery/orders/{o.order_id}/return/",
            {"items": [{"product": product.product_id, "quantity": 5}]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_double_confirm_blocked(self):
        o, product = self._order_with_item(qty=5)
        self.client.force_authenticate(self.agent)
        req_id = self.client.post(
            f"/delivery/orders/{o.order_id}/return/",
            {"items": [{"product": product.product_id, "quantity": 1}]}, format="json",
        ).data["data"]["id"]
        admin = self._admin()
        self.client.force_authenticate(admin)
        self.client.post(f"/delivery/admin/return-requests/{req_id}/confirm/", {})
        res = self.client.post(f"/delivery/admin/return-requests/{req_id}/confirm/", {})
        self.assertEqual(res.status_code, 400)

    # ---- admin sync reports (Phase 4) ----
    def _admin(self):
        return UserAuth.objects.create_superuser(
            phone="0151000001", password="pass", full_name="Boss", email="boss@x.com"
        )

    def test_admin_reports_accessible(self):
        # generate some data
        o = self._order(1000, assigned=self.agent)
        self.client.force_authenticate(self.agent)
        self.client.post(f"/delivery/orders/{o.order_id}/deliver/", {"amount": "600"})

        admin = self._admin()
        self.client.force_authenticate(admin)
        for name in ["collection_summary", "returns_summary", "due_summary", "delivery_performance"]:
            res = self.client.get(f"/reports/{name}/")
            self.assertEqual(res.status_code, 200, f"{name} -> {res.status_code}: {res.data}")
            self.assertEqual(res.data["status"], "success")

        # collection summary reflects the 600 collected today
        cs = self.client.get("/reports/collection_summary/").data
        self.assertEqual(float(cs["summary"]["today_collection"]), 600.0)
        # due summary shows the 400 outstanding
        ds = self.client.get("/reports/due_summary/").data
        self.assertEqual(float(ds["summary"]["total_customer_due"]), 400.0)
        # delivery performance: 1 delivered of 1 assigned
        dp = self.client.get("/reports/delivery_performance/").data
        self.assertEqual(dp["summary"]["delivered"], 1)
        self.assertEqual(dp["summary"]["success_rate"], 100.0)

    def test_admin_reports_forbidden_for_agent(self):
        self.client.force_authenticate(self.agent)
        res = self.client.get("/reports/collection_summary/")
        self.assertEqual(res.status_code, 403)

    # ---- admin assignment (Phase 4 admin screens) ----
    def test_admin_agents_list(self):
        admin = self._admin()
        self.client.force_authenticate(admin)
        res = self.client.get("/delivery/admin/agents/")
        self.assertEqual(res.status_code, 200)
        ids = [a["user_id"] for a in res.data["data"]]
        self.assertIn(self.agent.user_id, ids)

    def test_admin_assign_order(self):
        o = self._order(500, order_status="shipped")  # unassigned
        admin = self._admin()
        self.client.force_authenticate(admin)
        res = self.client.post(f"/delivery/admin/orders/{o.order_id}/assign/", {"delivery_man": self.agent.user_id})
        self.assertEqual(res.status_code, 200)
        o.refresh_from_db()
        self.assertEqual(o.assigned_to_id, self.agent.user_id)

    def test_admin_assignable_unassigned(self):
        self._order(500, order_status="shipped")               # unassigned
        self._order(500, order_status="shipped", assigned=self.agent)  # assigned
        admin = self._admin()
        self.client.force_authenticate(admin)
        res = self.client.get("/delivery/admin/orders/?assigned=unassigned&status=shipped")
        self.assertEqual(res.status_code, 200)
        rows = res.data["results"]["data"]
        self.assertTrue(all(r["assigned_to"] is None for r in rows))

    def test_agent_cannot_assign(self):
        o = self._order(500, order_status="shipped")
        self.client.force_authenticate(self.agent)
        res = self.client.post(f"/delivery/admin/orders/{o.order_id}/assign/", {"delivery_man": self.agent.user_id})
        self.assertEqual(res.status_code, 403)

    # ---- customer balance report ----
    def test_customer_balance(self):
        self._order(1000, order_status="delivered")   # delivered, due 1000
        o2 = self._order(500, order_status="delivered")
        set_collected_total(o2, 500)                   # delivered, fully paid
        self._order(700, order_status="cancelled")     # cancelled — excluded from due
        admin = self._admin()
        self.client.force_authenticate(admin)
        res = self.client.get("/reports/customer_balance/")
        self.assertEqual(res.status_code, 200)
        row = next(r for r in res.data["data"] if r["customer"] == self.customer.user_id)
        self.assertEqual(float(row["total_order_amount"]), 2200.0)  # all statuses
        self.assertEqual(float(row["total_collected"]), 500.0)
        self.assertEqual(float(row["total_due"]), 1000.0)           # delivered-only
        self.assertEqual(row["order_count"], 3)

    def test_customer_balance_scoped_to_self(self):
        self._order(1000)
        self.client.force_authenticate(self.customer)
        res = self.client.get("/reports/customer_balance/")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(all(r["customer"] == self.customer.user_id for r in res.data["data"]))

    # ---- ledger reconciliation ----
    def test_collected_amount_is_ledger_sum(self):
        o = self._order(1000, assigned=self.agent)
        set_collected_total(o, 300)
        o.refresh_from_db()
        self.assertEqual(float(o.collected_amount), 300.0)
        set_collected_total(o, 100)  # admin lowers it
        o.refresh_from_db()
        self.assertEqual(float(o.collected_amount), 100.0)
        ledger_sum = sum(p.amount for p in CollectionPayment.objects.filter(order=o))
        self.assertEqual(float(ledger_sum), 100.0)
