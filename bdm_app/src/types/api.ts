/** Types mirroring the Django REST serializers used by the BDM shop-owner app. */

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
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  area_name: string | null;
  is_approved: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

/** POST /auth/login/ response: { status, access_token, data: <user> }. */
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

export interface SignupPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  shop_name: string;
  shop_address: string;
  area_id: number;
}

/** Product from /products/products/ (ProductSerializer). */
export interface Product {
  product_id: number;
  product_name: string;
  generic_name: string | null;
  product_description: string | null;
  product_image: string | null;
  sku: string | null;
  quantity_per_box: number | null;
  company_id: number | null;
  company_name: string | null;
  category_id: number[];
  category_name: string[];
  stock_quantity: number;
  cost_price: number;
  mrp: number;
  selling_price: number;
  discount_percent: number;
  out_of_stock: boolean;
  is_active: boolean;
  /** Last-modified timestamp — used for image cache-busting. */
  updated_on?: string;
}

export interface ProductDetailResponse {
  status: string;
  data: Product;
  suggested_products?: Product[];
}

export interface Category {
  category_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

/** A category with its products, from /products/products/category/. */
export interface CategoryGroup {
  category_id: number;
  category_name: string;
  products: Product[];
}

export interface Company {
  company_id: number;
  company_name: string;
  logo: string | null;
  is_active: boolean;
}

export interface GenericName {
  generic_id: number;
  name: string;
  description: string | null;
}

export interface Banner {
  banner_id: number;
  image: string;
  name?: string | null;
  created_on?: string;
}

export interface Area {
  area_id: number;
  area_name: string;
  is_active: boolean;
}

/** A line in the local cart (product snapshot + quantity). */
export interface CartLine {
  product_id: number;
  product_name: string;
  product_image: string | null;
  company_name: string | null;
  selling_price: number;
  mrp: number;
  quantity: number;
  stock_quantity: number;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "due";

export type PaymentStatus = "Due" | "Partial" | "Paid";

export interface OrderItem {
  id?: number;
  product?: number;
  product_name: string;
  product_image?: string | null;
  company_name?: string | null;
  quantity: number;
  mrp?: number;
  selling_price?: number;
  items_total?: number;
}

export interface Order {
  order_id: number;
  invoice_number: string;
  subtotal_amount?: number;
  total_amount: number;
  collected_amount?: number;
  due_amount?: number;
  delivery_charge?: number;
  special_bonus?: number;
  order_status: OrderStatus;
  payment_status?: PaymentStatus;
  order_date: string;
  shop_name?: string | null;
  items?: OrderItem[];
}

export interface PrivacyPolicy {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
}

/** The current customer's balance summary (reports → customer_balance). */
export interface CustomerBalance {
  total_order_amount: number;
  total_collected: number;
  total_due: number;
}

/** An in-app notification for the current user (order updates, etc.). */
export interface AppNotification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Platform settings (settings → site_info). Public; used to gate the app. */
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

/** A tiered special-discount rule (settings → conditional discounts). */
export interface ConditionalDiscount {
  id: number;
  name: string;
  minimum_purchase_amount: string | number;
  bonus_percentage: string | number;
  is_active: boolean;
}

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

export interface Notice {
  id: number;
  title: string;
  message: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/** Generic { status, data, ... } envelope the backend wraps most responses in. */
export interface ApiEnvelope<T> {
  status: string;
  data: T;
  message?: string;
}

/** Paginated list shape. The product list nests the array at results.data. */
export interface Paginated<T> {
  status?: string;
  count?: number;
  total_pages?: number;
  current_page?: number;
  next?: string | null;
  previous?: string | null;
  data?: T[];
  results?: T[] | { status?: string; data?: T[] };
}
