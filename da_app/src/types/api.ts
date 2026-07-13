/** Types mirroring the Django REST serializers used by the delivery-man app.
 *  Only the delivery agent's surface area is modeled here. */

export type UserRole =
  | "admin"
  | "shop_owner"
  | "staff"
  | "customer"
  | "delivery_man";

export interface AuthUser {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  image: string | null;
  shop_name: string | null;
  shop_address: string | null;
  area: number | null;
  area_name: string | null;
  is_approved: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

/** POST /auth/login/ response.
 *  The backend returns: { status, access_token, data: <user> }. */
export interface LoginResponse {
  status?: string;
  access_token?: string;
  access?: string;
  token?: string;
  data?: AuthUser;
  user?: AuthUser;
  message?: string;
  [key: string]: unknown;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "due";

export type PaymentStatus = "Due" | "Partial" | "Paid";

/** Compact order row from GET /delivery/orders/. */
export interface DeliveryOrder {
  order_id: number;
  invoice_number: string;
  shop_name: string | null;
  customer_name: string;
  phone: string;
  address: string | null;
  area: string | null;
  shop_latitude: number | null;
  shop_longitude: number | null;
  invoice_amount: number;
  collected_amount: number;
  due_amount: number;
  payment_status: PaymentStatus;
  delivery_status: OrderStatus;
  assigned_to: number | null;
  assigned_to_name: string | null;
  order_date: string;
}

export interface DeliveryOrderItem {
  product: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  mrp: number;
  discount_percent: number;
  line_total: number;
}

export interface DeliveryOrderDetail extends DeliveryOrder {
  items: DeliveryOrderItem[];
}

export interface DeliveryDashboard {
  total_assigned: number;
  pending_deliveries: number;
  delivered_total: number;
  delivered_today: number;
  outstanding_dues: number;
  returned_products: number;
  today_collection: number;
  undeposited_amount: number;
  pending_deposit_amount: number;
  cash_in_hand: number;
}

/** Overall delivery summary ("top sheet") for the logged-in agent — totals. */
export interface DeliverySummary {
  code: number;
  delivery_man_name: string;
  phone: string;
  area: string | null;
  number_of_orders: number;
  delivered_count: number;
  unique_pharmacies: number;
  invoice_amount: number;
  return_amount: number;
  return_qty: number;
  net_sales: number;
  collected_amount: number;
  due_amount: number;
  payment_percent: number;
  money_collected: boolean;
}

export type DepositStatus = "pending" | "approved" | "rejected";

export interface DepositRequest {
  id: number;
  delivery_man: number;
  delivery_man_name: string;
  amount: number;
  status: DepositStatus;
  note: string | null;
  requested_at: string;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  payment_count: number;
}

export type ReturnRequestStatus = "pending" | "confirmed" | "rejected";

export interface ReturnRequestItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  reason: string | null;
}

export interface ReturnRequest {
  id: number;
  order: number;
  invoice_number: string;
  shop_name: string | null;
  delivery_man: number;
  delivery_man_name: string;
  status: ReturnRequestStatus;
  note: string | null;
  created_at: string;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  total_quantity: number;
  total_value: number;
  items: ReturnRequestItem[];
}

/** A finalized returned product (orders.ReturnItem) — includes admin order-edit returns. */
export interface ReturnedProduct {
  id: number;
  order: number;
  invoice_number: string;
  shop_name: string | null;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  reason: string | null;
  created_by: number | null;
  created_by_name: string | null;
  source: "admin" | "agent";
  created_on: string;
}

export interface AppNotification {
  id: number;
  user: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Notice {
  id: number;
  title: string;
  message: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/** Payload for submitting a return request line. */
export interface ReturnItemInput {
  product: number;
  quantity: number;
  reason: string;
}

/** Generic { status, data, ... } envelope the backend wraps most responses in. */
export interface ApiEnvelope<T> {
  status: string;
  data: T;
  message?: string;
}

/** Public platform settings (settings → general / site_info). */
export interface SiteInfo {
  name: string;
  logo: string | null;
  description: string;
  version: string;
  delivery_charge: number;
  contact_email: string;
  contact_phone: string;
  whatsapp_number?: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

/** A published Rider-app release (settings → app releases, app="da"). */
export interface AppRelease {
  id: number;
  version: string;
  updated_version: string;
  version_code: number;
  apk_url: string | null;
  release_notes: string | null;
  is_available: boolean;
  force_update: boolean;
  file_size: number;
}

export interface AppUpdateResponse {
  status: string;
  update_available: boolean;
  data: AppRelease | null;
}

/** Paginated list shape used by delivery list endpoints. */
export interface Paginated<T> {
  status?: string;
  count?: number;
  total_pages?: number;
  current_page?: number;
  next?: string | null;
  previous?: string | null;
  data?: T[];
  results?: T[];
}
