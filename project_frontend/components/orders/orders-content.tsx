'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Edit, Check, FileText, Trash2, Search, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useAllOrdersQuery,
  useDeleteOrderMutation,
  useFilterOrdersQuery,
  useLazyShopNameSuggestionsQuery,
  usePendingProductsQuery,
  useUpdateOrdersMutation,
} from '@/redux/feature/orderSlice';
import { useAreaListQuery } from '@/redux/feature/areaSlice';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';
import { usePrivacyPolicyQuery } from '@/redux/feature/userSlice';
import { API_BASE_URL } from '@/lib/config';


// Define interfaces
interface OrderItem {
  product: number;
  quantity: number;
  product_name?: string;
  selling_price?: string;
  items_total?: number;
  mrp?: number;
  discount?: number;
  discount_percent?: number;
  special_bonus?: number;
  special_bonus_percentage?: number;
}

interface ReturnItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: number;
  selling_price?: number;
  mrp?: number;
  discount_percent?: number;
  reason?: string;
  total_return?: number;
}

interface Order {
  id: string;
  date: string;
  customerName: string;
  shopName: string;
  invoiceNumber: string;
  amount: string;
  status: 'pending' | 'processing' | 'delivered' | 'shipped' | 'cancelled' | 'due';
  shippingAddress?: string;
  items?: OrderItem[];
  return_items?: ReturnItem[];
  total_return_amount?: number;
  name?: string;
  delivery_charge?: number;
  total_amount?: number;
  collected_amount?: number;
  due_amount?: number;
  invoice_number: string;
  full_name: string;
  discount?: number;
  mrp?: number;
  phone?: string;
  area?: string;
  special_bonus?: number;
  special_bonus_percentage?: number;
}

interface OrderUpdateFormValues {
  order_status: 'pending' | 'processing' | 'delivered' | 'shipped' | 'cancelled' | 'due';
  items: OrderItem[];
  collected_amount?: number;
}

interface Area {
  area_id: number;
  area_name: string;
  is_active: boolean;
}

// Helper functions
// Date + time in 12-hour format (e.g. "July 06, 2026, 09:57 PM). Used for the
// order table, the order/invoice modal, and the printed invoice.
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const formatDateTimeForAPI = (date: Date | null, time: string | null, defaultTime: string = '00:00') => {
  if (!date) return undefined;
  const dateStr = date.toLocaleDateString("en-CA");
  const useTime = time || defaultTime;
  return `${dateStr}T${useTime}:00`;
};

const mapApiToOrders = (apiData: any[]): Order[] =>
  apiData.map((order) => ({
    id: `#${order.order_id}`,
    date: formatDate(order.order_date),
    customerName: order.user_id ? `User-${order.user_id}` : 'Unknown',
    shopName: order.shop_name,
    amount: `৳${order.final_amount?.toFixed(2) || '0.00'}`,
    status: (order.order_status?.toLowerCase() || 'pending') as 'pending' | 'processing' | 'delivered' | 'shipped' | 'cancelled' | 'due',
    shippingAddress: order.shipping_address,
    items: order.items || [],
    return_items: order.return_items || [],
    total_return_amount: order.total_return_amount,
    name: order.full_name,
    invoiceNumber: order.invoice_number,
    delivery_charge: order.delivery_charge,
    total_amount: order.total_amount,
    collected_amount: order.collected_amount,
    due_amount: order.due_amount,
    invoice_number: order.invoice_number,
    full_name: order.full_name,
    phone: order.phone,
    area: order.area,
    special_bonus: order.special_bonus,
    special_bonus_percentage: order.special_bonus_percentage,
    subtotal_amount: order.subtotal_amount
  }));

const getStatusColor = (status: string) =>
({
  pending: 'text-red-400',
  processing: 'text-orange-400',
  delivered: 'text-green-400',
  shipped: 'text-cyan-400',
  cancelled: 'text-gray-400',
  due: 'text-yellow-400',
  default: 'text-gray-400',
}[status.toLowerCase()] || 'text-gray-400');

export default function Component() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusOrder, setStatusOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'processing' | 'delivered' | 'shipped' | 'cancelled' | 'due' | ''>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [collectedAmount, setCollectedAmount] = useState<string>('');
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    startTime: string | null;
    endTime: string | null;
    areaId: number | 'all';
    status: string;
    shopName: string;
  }>({
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    areaId: 'all',
    status: 'all',
    shopName: '',
  });
  const [shopNameInput, setShopNameInput] = useState('');
  const [shopSuggestionsOpen, setShopSuggestionsOpen] = useState(false);
  const [fetchShopSuggestions, { data: shopSuggestionsData, isFetching: shopSuggestionsLoading }] =
    useLazyShopNameSuggestionsQuery();
  const shopSuggestions: string[] = shopSuggestionsData?.data || [];
  console.log(filters?.startDate, '===========================', filters?.endDate);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 20;

  // Query hooks
  const {
    data: allOrdersData,
    isLoading: allOrdersLoading,
    isError: allOrdersError,
    refetch: refetchAllOrders,
  } = useAllOrdersQuery({
    page,
    limit: itemsPerPage,
    pageSize: itemsPerPage,
    date: filters.startDate ? formatDateTimeForAPI(filters.startDate, null) : undefined,
  }, { skip: activeTab !== 'all' || isFilterApplied });

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
    refetch: refetchPendingOrders,
  } = usePendingProductsQuery({
    page,
    limit: itemsPerPage,
    date: filters.startDate ? formatDateTimeForAPI(filters.startDate, null) : undefined,
  }, { skip: activeTab !== 'pending' || isFilterApplied });

  const { data: areaData } = useAreaListQuery(undefined);

  const {
    data: filterData,
    isLoading: filterLoading,
    isError: filterError,
    refetch: refetchFilterOrders,
  } = useFilterOrdersQuery(
    {
      page,
      limit: itemsPerPage,
      from_datetime: filters.startDate ? formatDateTimeForAPI(filters.startDate, filters.startTime, '00:00') : undefined,
      to_datetime: filters.endDate ? formatDateTimeForAPI(filters.endDate, filters.endTime, '23:59') : undefined,
      area: filters.areaId,
      // On the Pending tab, always scope filtered results to pending orders,
      // regardless of the (defaulted-to-"all") Status dropdown.
      status: activeTab === 'pending' ? 'pending' : filters.status,
      shop_name: filters.shopName || undefined,
    },
    { skip: !isFilterApplied }
  );

  const { data } = usePrivacyPolicyQuery(undefined);
  console.log(data?.data, 'privace=========')

  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrders] = useUpdateOrdersMutation();

  // Debounced refetch
  const debouncedRefetch = useCallback(
    debounce(() => {
      if (isFilterApplied) {
        refetchFilterOrders();
      } else if (activeTab === 'all') {
        refetchAllOrders();
      } else {
        refetchPendingOrders();
      }
    }, 500),
    [activeTab, isFilterApplied, refetchAllOrders, refetchPendingOrders, refetchFilterOrders]
  );

  // Update orders based on active tab and filter
  useEffect(() => {
    if (isFilterApplied && filterData?.results?.data) {
      setOrders(mapApiToOrders(filterData.results.data));
      setTotalOrders(filterData.count || 0);
      setTotalAmount(Number(filterData.results.total_amount_sum) || 0);
    } else if (activeTab === 'all' && allOrdersData?.results?.data) {
      setOrders(mapApiToOrders(allOrdersData.results.data));
      setTotalOrders(allOrdersData.count || 0);
      setTotalAmount(Number(allOrdersData.results.total_amount_sum) || 0);
    } else if (activeTab === 'pending' && pendingData?.data) {
      // Backend returns all pending orders without server-side pagination,
      // so slice client-side based on the current page.
      const allPending = mapApiToOrders(pendingData.data);
      const startIdx = (page - 1) * itemsPerPage;
      setOrders(allPending.slice(startIdx, startIdx + itemsPerPage));
      setTotalOrders(allPending.length);
      setTotalAmount(Number(pendingData.total_amount_sum) || 0);
    } else {
      setOrders([]);
      setTotalOrders(0);
      setTotalAmount(0);
    }
  }, [activeTab, allOrdersData, pendingData, filterData, isFilterApplied, page]);

  // Reset page and refetch when tab or filters change
  useEffect(() => {
    setPage(1);
    debouncedRefetch();
  }, [activeTab, isFilterApplied, filters, debouncedRefetch]);

  // Debounced shop name suggestions (only when 2+ chars)
  const debouncedShopSuggestions = useCallback(
    debounce((q: string) => {
      if (q.trim().length >= 2) {
        fetchShopSuggestions(q.trim());
      }
    }, 300),
    [fetchShopSuggestions]
  );

  useEffect(() => {
    const q = shopNameInput.trim();
    if (q.length >= 2) {
      debouncedShopSuggestions(q);
      setShopSuggestionsOpen(true);
    } else {
      setShopSuggestionsOpen(false);
    }
  }, [shopNameInput, debouncedShopSuggestions]);

  // Set default status and items for update dialog
  useEffect(() => {
    if (statusOrder) {
      setNewStatus(statusOrder.status || 'delivered');
      setItems(statusOrder.items?.length ? statusOrder.items : [{ product: 0, quantity: 1 }]);
      setCollectedAmount(
        statusOrder.collected_amount != null ? String(statusOrder.collected_amount) : ''
      );
    } else {
      setNewStatus('');
      setItems([]);
      setCollectedAmount('');
    }
  }, [statusOrder]);

  const handleDirectPrintInvoice = useCallback(
    (order: Order) => {
      const itemsHtml = (order.items || [])
        .map(
          (item: any, idx: number) => `
            <tr>
              <td style="border:1px solid #000;padding:6px;text-align:center;">${idx + 1}</td>
              <td style="border:1px solid #000;padding:6px;font-weight:bold;">${item.product_name || `Product ID: ${item.product}`}</td>
              <td style="border:1px solid #000;padding:6px;text-align:right;">${item?.mrp ?? 'N/A'}</td>
              <td style="border:1px solid #000;padding:6px;text-align:right;">${item.discount_percent || 'N/A'}%</td>
              <td style="border:1px solid #000;padding:6px;text-align:right;">${item.selling_price || 'N/A'}</td>
              <td style="border:1px solid #000;padding:6px;text-align:center;">${item.quantity}</td>
              <td style="border:1px solid #000;padding:6px;text-align:right;">${item.items_total?.toFixed(2) || 'N/A'}</td>
            </tr>`
        )
        .join('');

      const returnItems = order.return_items || [];
      const returnItemsHtml = returnItems
        .map(
          (item: any, idx: number) => {
            const lineTotal =
              item.total_return ?? (Number(item.selling_price) || 0) * item.quantity;
            return `
            <tr>
              <td style="border:1px solid #000;padding:6px;text-align:center;">${idx + 1}</td>
              <td style="border:1px solid #000;padding:6px;font-weight:bold;">${item.product_name || `Product ID: ${item.product}`}</td>
              <td style="border:1px solid #000;padding:6px;text-align:right;">${item?.mrp ?? 'N/A'}</td>
              <td style="border:1px solid #000;padding:6px;text-align:right;">${item.discount_percent ?? 'N/A'}%</td>
              <td style="border:1px solid #000;padding:6px;text-align:right;">${item.selling_price ?? 'N/A'}</td>
              <td style="border:1px solid #000;padding:6px;text-align:center;">${item.quantity}</td>
              <td style="border:1px solid #000;padding:6px;text-align:right;">${Number(lineTotal).toFixed(2)}</td>
              <td style="border:1px solid #000;padding:6px;">${item.reason || ''}</td>
            </tr>`;
          }
        )
        .join('');

      const returnSectionHtml = returnItems.length
        ? `
      <h3 style="font-size: 1rem; font-weight: bold; margin: 16px 0 6px 0; color:#b91c1c;">Returned Items</h3>
      <table>
        <thead>
          <tr>
            <th>Sl</th>
            <th>Item</th>
            <th>MRP</th>
            <th>Disc.</th>
            <th>Rate</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>${returnItemsHtml}</tbody>
      </table>
      <div style="margin-top: 6px; text-align: right; font-weight: bold;">
        Total Returned: ${(order.total_return_amount ?? 0).toFixed(2)}
      </div>`
        : '';

      const termsHtml = (data?.data || [])
        .map((t: any) =>
          (t?.content || '')
            .split('\n')
            .filter((line: string) => line)
            .map((line: string) => `<div style="margin-bottom:2px;">${line}</div>`)
            .join('')
        )
        .join('');

      const showSpecialBonus =
        ((order.special_bonus_percentage as number) || 0) > 0 &&
        ((order.special_bonus as number) || 0) > 0;

      const logoSrc = `${window.location.origin}/invoicelogo.jpg`;

      const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Invoice ${order.invoiceNumber}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 16px; font-family: Arial, sans-serif; color: #000; background: #fff; font-size: 14px; }
      p { margin: 0 0 4px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #000; padding: 6px; }
      th { background: #e5e7eb; color: #000; font-weight: 700; }
      img { max-height: 50px; object-fit: contain; }
      .invoice-billing { display: flex; justify-content: space-between; gap: 1rem; }
      .invoice-billing > div { flex: 1; }
      .totals-section ul { margin: 0; list-style: none; padding: 16px; }
      .totals-section li { display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #e5e7eb; }
      .totals-section li:first-child { border-top: 0; }
      .totals-section li.total-row { font-weight: 700; font-size: 1.05rem; }
      @page { size: auto; margin: 10mm; }
    </style>
  </head>
  <body>
    <div style="padding: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div><img src="${logoSrc}" alt="Fiha Pharma" /></div>
        <h2 style="font-size: 1.5rem; font-weight: bold; margin: 0;">${order.invoiceNumber}</h2>
      </div>

      <div style="margin-top: 8px;">
        <div class="invoice-billing">
          <div>
            <p><strong>Bill from:</strong></p>
            <p>Fiha Pharma</p>
            <p>Wholesale Supplier</p>
            <p><strong>Phone</strong>: 01558920438</p>
            <p><strong>Address</strong>: Holding No-58, Word No-45, Helal Market, Uttar Khan, Uttara, Dhaka-1230</p>
          </div>
          <div>
            <p><strong>Bill to:</strong></p>
            <p><strong>Name:</strong> ${order.name || 'N/A'}</p>
            <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
            <p><strong>Area:</strong> ${order.area || 'N/A'}</p>
            <p><strong>Shop Name:</strong> ${order.shopName}</p>
            <p><strong>Address:</strong> ${order.shippingAddress || 'N/A'}</p>
          </div>
        </div>
        <div style="margin-top: 6px;"><p><strong>Date:</strong> ${order.date}</p></div>
      </div>

      <table style="margin-top: 8px;">
        <thead>
          <tr>
            <th>Sl</th>
            <th>Item</th>
            <th>MRP</th>
            <th>Disc.</th>
            <th>Rate</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      ${returnSectionHtml}

      <div class="totals-section" style="margin-top: 8px;">
        <ul>
          <li><span>Subtotal</span><span>${(order as any).subtotal_amount?.toFixed(2) || 'N/A'}</span></li>
          <li><span>Delivery Charge</span><span>${order.delivery_charge?.toFixed(2) || 'N/A'}</span></li>
          ${showSpecialBonus
            ? `<li><span>Special Bonus (${order.special_bonus_percentage?.toFixed(2)}%)</span><span>${order.special_bonus?.toFixed(2)}</span></li>`
            : ''}
          <li class="total-row"><span>Total</span><span>${order.amount}</span></li>
        </ul>
        <div style="margin-top: 8px; font-size: 11px;">
          <strong>Terms &amp; Conditions:</strong>
          <div style="margin-top: 4px;">${termsHtml}</div>
        </div>
      </div>
    </div>
  </body>
</html>`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');

      const cleanup = () => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      };

      iframe.onload = () => {
        const cw = iframe.contentWindow;
        if (!cw) {
          cleanup();
          return;
        }
        cw.addEventListener('afterprint', cleanup);
        cw.focus();
        cw.print();
        setTimeout(cleanup, 10000);
      };

      iframe.srcdoc = html;
      document.body.appendChild(iframe);
    },
    [data]
  );

  const handleAction = useCallback(
    (orderIndex: number, action: 'approve' | 'info' | 'delete' | 'download') => {
      const order = orders[orderIndex];
      switch (action) {
        case 'approve':
          setStatusOrder(order);
          break;
        case 'info':
          handleDirectPrintInvoice(order);
          break;
        case 'delete':
          setDeleteConfirmOrder(order);
          break;
        case 'download':
          handleDownloadInvoice(order);
          break;
      }
    },
    [orders, handleDirectPrintInvoice]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteOrder(id).unwrap();
        toast.success('Order deleted successfully!', { position: 'top-right' });
        setDeleteConfirmOrder(null);
        debouncedRefetch();
      } catch {
        toast.error('Failed to delete order!', { position: 'top-right' });
      }
    },
    [deleteOrder, debouncedRefetch]
  );

  const handleUpdateStatus = useCallback(async () => {
    if (!statusOrder || !newStatus) return;
    const orderId = parseInt(statusOrder.id.replace(/^#/, ''));
    if (isNaN(orderId)) {
      toast.error('Invalid order ID!', { position: 'top-right' });
      return;
    }
    try {
      const updateData: OrderUpdateFormValues = {
        order_status: newStatus,
        items: items.map(({ product, quantity }) => ({ product, quantity })),
        collected_amount: Number(collectedAmount) || 0,
      };
      await updateOrders({ id: orderId, data: updateData }).unwrap();
      toast.success('Order updated successfully!', { position: 'top-right' });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === statusOrder.id
            ? { ...order, status: newStatus, items, collected_amount: Number(collectedAmount) || 0 }
            : order
        )
      );
      setStatusOrder(null);
      setNewStatus('');
      setItems([]);
      setCollectedAmount('');
      debouncedRefetch();
    } catch {
      toast.error('Failed to update order!', { position: 'top-right' });
    }
  }, [statusOrder, newStatus, items, collectedAmount, updateOrders, debouncedRefetch]);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, { product: 0, quantity: 1 }]);
  }, []);

  const handleUpdateItem = useCallback((index: number, field: 'product' | 'quantity', value: number) => {
    setItems((prev) => {
      const updatedItems = [...prev];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return updatedItems;
    });
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      areaId: 'all',
      status: 'all',
      shopName: '',
    });
    setShopNameInput('');
    setShopSuggestionsOpen(false);
    setIsFilterApplied(false);
  }, []);

  const hasAnyFilter = Boolean(
    filters.startDate ||
    filters.endDate ||
    filters.areaId !== 'all' ||
    filters.status !== 'all' ||
    filters.shopName
  );

  const handleApplyFilters = useCallback(() => {
    if (hasAnyFilter) {
      setIsFilterApplied(true);
      debouncedRefetch();
    } else {
      toast.error('Please set at least one filter!', { position: 'top-right' });
    }
  }, [hasAnyFilter, debouncedRefetch]);

  const handleDownloadOrders = useCallback(async () => {
    try {
      setIsDownloading(true);
      const params = new URLSearchParams();
      const fromDt = filters.startDate
        ? formatDateTimeForAPI(filters.startDate, filters.startTime, '00:00')
        : undefined;
      const toDt = filters.endDate
        ? formatDateTimeForAPI(filters.endDate, filters.endTime, '23:59')
        : undefined;
      if (fromDt) params.append('from_datetime', fromDt);
      if (toDt) params.append('to_datetime', toDt);
      params.append('area', filters.areaId.toString());
      // On the Pending tab, always export pending only. Otherwise, when no date
      // range is set, default to pending so the user doesn't accidentally export
      // the entire history.
      const effectiveStatus =
        activeTab === 'pending' || (!filters.startDate && !filters.endDate)
          ? 'pending'
          : filters.status;
      params.append('status', effectiveStatus);
      if (filters.shopName) params.append('shop_name', filters.shopName);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/orders/download_orders/${queryString ? `?${queryString}` : ''}`;
      const token = localStorage.getItem('accessToken');

      const response = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      let filename = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Orders downloaded successfully!', { position: 'top-right' });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download orders!', { position: 'top-right' });
    } finally {
      setIsDownloading(false);
    }
  }, [filters, activeTab]);

  const handlePrintReport = useCallback(async () => {
    try {
      setIsPrinting(true);
      const params = new URLSearchParams();
      const fromDt = filters.startDate
        ? formatDateTimeForAPI(filters.startDate, filters.startTime, '00:00')
        : undefined;
      const toDt = filters.endDate
        ? formatDateTimeForAPI(filters.endDate, filters.endTime, '23:59')
        : undefined;
      if (fromDt) params.append('from_datetime', fromDt);
      if (toDt) params.append('to_datetime', toDt);
      if (filters.areaId !== 'all') params.append('area', filters.areaId.toString());
      // On the Pending tab, always scope the report to pending orders.
      const printStatus = activeTab === 'pending' ? 'pending' : filters.status;
      if (printStatus !== 'all') params.append('status', printStatus);
      if (filters.shopName) params.append('shop_name', filters.shopName);
      params.append('page_size', '500');
      params.append('page', '1');

      const url = `${API_BASE_URL}/orders/orders/?${params.toString()}`;
      const token = localStorage.getItem('accessToken');
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const json = await response.json();
      const printOrders: any[] = json?.results?.data || [];

      if (printOrders.length === 0) {
        toast.error('No orders to print!', { position: 'top-right' });
        return;
      }

      const totalAmount = printOrders.reduce(
        (s: number, o: any) => s + (Number(o.final_amount) || 0),
        0
      );
      const totalDeliveryCharge = printOrders.reduce(
        (s: number, o: any) => s + (Number(o.delivery_charge) || 0),
        0
      );

      const areaName =
        filters.areaId === 'all'
          ? 'All Areas'
          : areaData?.data?.find((a: Area) => a.area_id === filters.areaId)?.area_name ||
            `Area #${filters.areaId}`;

      const statusLabel =
        printStatus === 'all'
          ? 'All Statuses'
          : printStatus.charAt(0).toUpperCase() + printStatus.slice(1);

      const fromLabel = filters.startDate
        ? new Date(fromDt!).toLocaleString()
        : '';
      const toLabel = filters.endDate
        ? new Date(toDt!).toLocaleString()
        : '';

      const periodLabel =
        filters.startDate || filters.endDate
          ? `${fromLabel} ${toLabel}`
          : 'All Time';
      const subtotalNet = totalAmount - totalDeliveryCharge;
      const logoSrc = `${window.location.origin}/invoicelogo.jpg`;

      const printHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Orders Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background: #fff;
        color: #1a1a1a;
        line-height: 1.45;
        font-size: 12px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page { padding: 24px 28px; max-width: 1200px; margin: 0 auto; }

      /* Letterhead */
      .letterhead {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #1a3a52;
        padding-bottom: 14px;
        margin-bottom: 18px;
        page-break-inside: avoid;
      }
      .letterhead-brand { display: flex; align-items: center; gap: 14px; }
      .letterhead-brand img { height: 56px; object-fit: contain; }
      .letterhead-brand .name h2 {
        font-size: 19px;
        color: #1a3a52;
        letter-spacing: 0.4px;
        margin-bottom: 2px;
        font-weight: 700;
      }
      .letterhead-brand .name p { font-size: 11px; color: #6b7280; }
      .letterhead-contact { text-align: right; font-size: 11px; color: #4b5563; }
      .letterhead-contact p { margin-bottom: 2px; }
      .letterhead-contact strong { color: #1a1a1a; }

      /* Report title */
      .report-title { text-align: center; margin-bottom: 18px; }
      .report-title h1 {
        font-size: 22px;
        color: #1a3a52;
        letter-spacing: 3px;
        font-weight: 700;
      }
      .report-title .subtitle {
        font-size: 11px;
        color: #6b7280;
        margin-top: 4px;
        letter-spacing: 0.5px;
      }

      /* Filter summary panel */
      .filter-panel {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px 22px;
        padding: 12px 16px;
        background: #f8fafc;
        border-left: 3px solid #1a3a52;
        margin-bottom: 18px;
        font-size: 11.5px;
        page-break-inside: avoid;
      }
      .filter-row { display: flex; gap: 6px; }
      .filter-label { color: #6b7280; min-width: 72px; }
      .filter-value { color: #1a1a1a; font-weight: 600; }

      /* Data table */
      table.data {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      table.data thead { display: table-header-group; }
      table.data thead tr { border-bottom: 2px solid #1a3a52; }
      table.data thead th {
        padding: 9px 8px;
        text-align: left;
        color: #1a3a52;
        font-weight: 700;
        font-size: 10.5px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
      }
      table.data thead th.num { text-align: right; }
      table.data thead th.ctr { text-align: center; }

      table.data tbody td {
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 11px;
        vertical-align: middle;
      }
      table.data tbody tr { page-break-inside: avoid; }
      table.data tbody tr:nth-child(odd) { background: #fafbfc; }

      .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .ctr { text-align: center; }
      .invoice-cell { font-weight: 700; color: #1a3a52; white-space: nowrap; }
      .amount-cell { font-weight: 600; }

      /* Status pills (kept subtle) */
      .status {
        display: inline-block;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        padding: 3px 8px;
        border-radius: 3px;
      }
      .status.pending   { background: #fff1f0; color: #b91c1c; }
      .status.processing{ background: #f0fdfa; color: #0f766e; }
      .status.shipped   { background: #eff6ff; color: #1d4ed8; }
      .status.delivered { background: #ecfdf5; color: #047857; }
      .status.cancelled { background: #f3f4f6; color: #4b5563; }
      .status.due       { background: #fef9c3; color: #854d0e; }

      /* Summary totals */
      .summary {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
        page-break-inside: avoid;
      }
      .summary-box {
        min-width: 320px;
        border: 1px solid #d1d5db;
        border-top: 2px solid #1a3a52;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 9px 16px;
        font-size: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      .summary-row:last-child { border-bottom: 0; }
      .summary-row .label { color: #4b5563; }
      .summary-row .value { font-variant-numeric: tabular-nums; font-weight: 600; }
      .summary-row.grand {
        border-top: 2px solid #1a3a52;
        font-size: 14px;
      }
      .summary-row.grand .label,
      .summary-row.grand .value { color: #1a3a52; font-weight: 700; }

      /* Signature section */
      .signatures {
        margin-top: 56px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        page-break-inside: avoid;
      }
      .sig-block { text-align: center; }
      .sig-line {
        border-top: 1px solid #1a1a1a;
        padding-top: 6px;
        font-size: 11px;
        color: #4b5563;
        font-weight: 500;
        letter-spacing: 0.3px;
      }

      /* Footer */
      .doc-footer {
        margin-top: 28px;
        padding-top: 10px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        font-size: 9.5px;
        color: #9ca3af;
        letter-spacing: 0.2px;
      }

      @media print {
        body { margin: 0; padding: 0; }
        .page { padding: 0; max-width: none; }
        table.data thead { display: table-header-group; }
        a { color: inherit; text-decoration: none; }
      }
      @page { size: A4; margin: 12mm; }
    </style>
  </head>
  <body>
    <div class="page">
      <!-- Letterhead -->
      <div class="letterhead">
        <div class="letterhead-brand">
          <img src="${logoSrc}" alt="Fiha Pharma" />
          <div class="name">
            <h2>Fiha Pharma</h2>
            <p>Wholesale Pharmaceutical Supplier</p>
          </div>
        </div>
        <div class="letterhead-contact">
          <p><strong>Phone:</strong> 01558920438</p>
          <p>Holding No-58, Word No-45, Helal Market</p>
          <p>Uttar Khan, Uttara, Dhaka-1230</p>
        </div>
      </div>

      <!-- Title -->
      <div class="report-title">
        <h1>ORDERS REPORT</h1>
        <div class="subtitle">${periodLabel}</div>
      </div>

      <!-- Filter summary -->
      <div class="filter-panel">
        <div class="filter-row"><span class="filter-label">Area:</span><span class="filter-value">${areaName}</span></div>
        <div class="filter-row"><span class="filter-label">Status:</span><span class="filter-value">${statusLabel}</span></div>
        <div class="filter-row"><span class="filter-label">Orders:</span><span class="filter-value">${printOrders.length}</span></div>
        <div class="filter-row"><span class="filter-label">From:</span><span class="filter-value">${fromLabel}</span></div>
        <div class="filter-row"><span class="filter-label">To:</span><span class="filter-value">${toLabel}</span></div>
        <div class="filter-row"><span class="filter-label">Generated:</span><span class="filter-value">${new Date().toLocaleString()}</span></div>
      </div>

      <!-- Data Table -->
      <table class="data">
        <thead>
          <tr>
            <th class="ctr" style="width:30px;">#</th>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Shop</th>
            <th>Address</th>
            <th>Phone</th>
            <th class="num">Delivery</th>
            <th class="num">Amount</th>
            <th class="ctr">Status</th>
          </tr>
        </thead>
        <tbody>
          ${printOrders
            .map(
              (order: any, i: number) => `
            <tr>
              <td class="ctr">${i + 1}</td>
              <td class="invoice-cell">${order.invoice_number ?? ''}</td>
              <td>${order.full_name ?? ''}</td>
              <td>${order.shop_name ?? ''}</td>
              <td>${order.shipping_address ?? ''}</td>
              <td>${order.phone ?? ''}</td>
              <td class="num">৳${(Number(order.delivery_charge) || 0).toFixed(2)}</td>
              <td class="num amount-cell">৳${(Number(order.final_amount) || 0).toFixed(2)}</td>
              <td class="ctr"><span class="status ${order.order_status ?? ''}">${
                order.order_status
                  ? order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)
                  : ''
              }</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="summary">
        <div class="summary-box">
          <div class="summary-row">
            <span class="label">Subtotal (${printOrders.length} order${printOrders.length === 1 ? '' : 's'})</span>
            <span class="value">৳${subtotalNet.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span class="label">Delivery Charges</span>
            <span class="value">৳${totalDeliveryCharge.toFixed(2)}</span>
          </div>
          <div class="summary-row grand">
            <span class="label">GRAND TOTAL</span>
            <span class="value">৳${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div class="sig-block">
          <div class="sig-line">Prepared By</div>
        </div>
        <div class="sig-block">
          <div class="sig-line">Authorized Signature</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="doc-footer">
        <span>Fiha Pharma Confidential Business Document</span>
        <span>Printed: ${new Date().toLocaleString()}</span>
      </div>
    </div>
  </body>
</html>`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');

      const cleanup = () => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      };

      iframe.onload = () => {
        const cw = iframe.contentWindow;
        if (!cw) {
          cleanup();
          return;
        }
        cw.addEventListener('afterprint', cleanup);
        cw.focus();
        cw.print();
        // Fallback removal in case afterprint doesn't fire (Safari/iOS edge cases).
        setTimeout(cleanup, 10000);
      };

      iframe.srcdoc = printHtml;
      document.body.appendChild(iframe);

      toast.success('Opening print dialog...', { position: 'top-right' });
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Failed to open print window!', { position: 'top-right' });
    } finally {
      setIsPrinting(false);
    }
  }, [filters, areaData, activeTab]);



  const handleDownloadInvoice = useCallback(
    async (order: Order) => {
      if (invoiceRef.current && order) {
        try {
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a5",
          });

          const rows = Array.from(invoiceRef.current.querySelectorAll("tbody tr"));
          const chunkSize = 15; // max rows per page
          const totalPages = Math.ceil(rows.length / chunkSize);

          for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const chunkRows = rows.slice(
              pageIndex * chunkSize,
              (pageIndex + 1) * chunkSize
            );

            // Clone invoice for this page
            const tableClone = invoiceRef.current.cloneNode(true) as HTMLElement;

            const tbody = tableClone.querySelector("tbody");
            if (tbody) {
              tbody.innerHTML = "";
              chunkRows.forEach((row) => tbody.appendChild(row.cloneNode(true)));
            }


            // Remove totals section for all but last page
            const totals = tableClone.querySelector(".totals-section");
            if (pageIndex < totalPages - 1 && totals) totals.remove();

            // Hide cloned node offscreen
            tableClone.style.position = "fixed";
            tableClone.style.left = "-9999px";
            document.body.appendChild(tableClone);
            tableClone.style.transform = "scale(1.5)"; // <-- ADD THIS LINE
            tableClone.style.transformOrigin = "top left"; // <-- ADD THIS LINE TOO
            tableClone.style.width = "625px"; // Compensate for scale

            // Render to canvas
            const canvas = await html2canvas(tableClone, { scale: 3, useCORS: true });

            // Cleanup
            document.body.removeChild(tableClone);

            // Add image to PDF
            const pagePadding = 10;
            const imgWidth = 148 - 2 * pagePadding; // A5 width
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (pageIndex > 0) pdf.addPage();
            pdf.addImage(
              canvas.toDataURL("image/jpeg", 1.0),
              "JPEG",
              pagePadding,
              pagePadding,
              imgWidth,
              imgHeight
            );
          }

          pdf.save(`invoice_${order.id.replace("#", "")}.pdf`);
        } catch (error) {
          console.error("Error generating invoice PDF:", error);
          toast.error("Failed to generate invoice PDF!", { position: "top-right" });
        }
      } else {
        toast.error("Invoice content not found!", { position: "top-right" });
      }
    },
    []
  );

  const handlePrintInvoice = useCallback(() => {
    if (!invoiceRef.current) {
      toast.error('Invoice content not found!', { position: 'top-right' });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Unable to open print window. Please allow popups.', { position: 'top-right' });
      return;
    }

    const invoiceHtml = invoiceRef.current.innerHTML;
    const logoImage = invoiceRef.current.querySelector('img');
    const logoSrc = logoImage?.getAttribute('src') || '';
    const absoluteLogoSrc = logoSrc
      ? new URL(logoSrc, window.location.origin).toString()
      : '';

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Print Invoice</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 16px;
              font-family: Arial, sans-serif;
              color: #000;
              background: #fff;
              font-size: 14px;
            }
            .space-y-2 > * + * { margin-block-start: 0.5rem; }
            .p-2 { padding: 0.5rem; }
            .p-4 { padding: 1rem; }
            .mt-2 { margin-block-start: 0.5rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .items-center { align-items: center; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; }
            .gap-4 { gap: 1rem; }
            .w-full { inline-size: 100%; }
            .text-xs { font-size: 0.75rem; }
            .text-lg { font-size: 1.125rem; }
            .text-2xl { font-size: 1.5rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .divide-y > * + * { border-block-start: 1px solid #e5e7eb; }
            table {
              inline-size: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px;
            }
            th {
              background: #3b55a0;
              color: #fff;
            }
            img {
              max-block-size: 50px;
              object-fit: contain;
            }
            .bg-white { background: #fff; }
            .text-white, .text-gray-900, .text-black {
              color: #000 !important;
            }
            .bg-\[\#3b55a0\] { background: #3b55a0; }
            .invoice-billing {
              display: flex;
              justify-content: space-between;
              gap: 1rem;
            }
            .invoice-billing > div {
              flex: 1;
            }
            .totals-section ul {
              margin: 0;
              list-style: none;
            }
            @page {
              size: auto;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          ${invoiceHtml}
        </body>
      </html>
    `);

    printWindow.document.close();

    if (absoluteLogoSrc) {
      const img = printWindow.document.querySelector('img');
      if (img) {
        img.setAttribute('src', absoluteLogoSrc);
      }
    }

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  }, []);




  const renderPagination = useCallback(() => {
    const totalPages = Math.ceil(totalOrders / itemsPerPage);
    const maxVisiblePages = 5;
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;

      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="text-white hover:bg-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((pageNum) => (
          <Button
            key={pageNum}
            variant={page === pageNum ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handlePageChange(pageNum)}
            className={page === pageNum ? 'bg-green-500 hover:bg-green-600 text-white' : 'text-white hover:bg-gray-700'}
          >
            {pageNum}
          </Button>
        ))}
        {totalPages > maxVisiblePages && pages[pages.length - 1] < totalPages && (
          <>
            <span className="text-gray-400 px-2">...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="text-white hover:bg-gray-700"
            >
              {totalPages}
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="text-white hover:bg-gray-700"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }, [page, totalOrders, handlePageChange]);

  const isLoading = isFilterApplied ? filterLoading : activeTab === 'all' ? allOrdersLoading : pendingLoading;
  const isError = isFilterApplied ? filterError : activeTab === 'all' ? allOrdersError : pendingError;

  return (
    <div className="text-white pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Order Details</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'pending')} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending Orders</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-[#1a1c20] border border-gray-700 rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Filter Orders</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-md">
              <span className="text-sm text-gray-300">
                {activeTab === 'pending' ? 'Pending Orders' : 'Total Orders'}:
              </span>
              <span className="text-sm font-semibold text-green-400">
                {totalOrders}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-md">
              <span className="text-sm text-gray-300">Total Amount:</span>
              <span className="text-sm font-semibold text-purple-400">
                ৳{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-400 font-medium">Start Date</Label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => setFilters((prev) => ({ ...prev, startDate: date }))}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date"
              className="bg-[#23252b] text-white border border-gray-600 rounded-md py-2 px-3 w-full text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-400 font-medium">Start Time</Label>
            <Input
              type="time"
              value={filters.startTime || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, startTime: e.target.value }))}
              className="bg-[#23252b] text-white border border-gray-600 rounded-md py-2 px-3 w-full text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-400 font-medium">End Date</Label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => setFilters((prev) => ({ ...prev, endDate: date }))}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date"
              className="bg-[#23252b] text-white border border-gray-600 rounded-md py-2 px-3 w-full text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-400 font-medium">End Time</Label>
            <Input
              type="time"
              value={filters.endTime || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, endTime: e.target.value }))}
              className="bg-[#23252b] text-white border border-gray-600 rounded-md py-2 px-3 w-full text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-400 font-medium">Area</Label>
            <Select
              value={filters.areaId.toString()}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  areaId: value === 'all' ? 'all' : parseInt(value),
                }))
              }
            >
              <SelectTrigger className="w-full bg-[#23252b] border-gray-600 text-sm">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-gray-600">
                <SelectGroup>
                  <SelectItem className="text-white" value="all">
                    All Areas
                  </SelectItem>
                  {areaData?.data?.map((area: Area) => (
                    <SelectItem className="text-white" key={area.area_id} value={area.area_id.toString()}>
                      {area.area_name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 relative">
            <Label className="text-xs text-gray-400 font-medium">Shop Name</Label>
            <Input
              type="text"
              value={shopNameInput}
              onChange={(e) => {
                const v = e.target.value;
                setShopNameInput(v);
                setFilters((prev) => ({ ...prev, shopName: v }));
              }}
              onFocus={() => {
                if (shopNameInput.trim().length >= 2) setShopSuggestionsOpen(true);
              }}
              onBlur={() => {
                setTimeout(() => setShopSuggestionsOpen(false), 150);
              }}
              placeholder="Search shop (2+ letters)"
              className="bg-[#23252b] text-white border border-gray-600 rounded-md py-2 px-3 w-full text-sm"
            />
            {shopSuggestionsOpen && shopNameInput.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-gray-600 rounded-md shadow-lg max-h-56 overflow-y-auto z-50">
                {shopSuggestionsLoading ? (
                  <div className="px-3 py-2 text-xs text-gray-400">Searching...</div>
                ) : shopSuggestions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">No matches</div>
                ) : (
                  shopSuggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShopNameInput(name);
                        setFilters((prev) => ({ ...prev, shopName: name }));
                        setShopSuggestionsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      {name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-400 font-medium">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full bg-[#23252b] border-gray-600 text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-gray-600">
                <SelectGroup>
                  <SelectItem className="text-white" value="all">All Statuses</SelectItem>
                  <SelectItem className="text-red-400" value="pending">Pending</SelectItem>
                  <SelectItem className="text-orange-400" value="processing">Processing</SelectItem>
                  <SelectItem className="text-cyan-400" value="shipped">Shipped</SelectItem>
                  <SelectItem className="text-green-400" value="delivered">Delivered</SelectItem>
                  <SelectItem className="text-gray-400" value="cancelled">Cancelled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-4"
              onClick={handleDownloadOrders}
              disabled={isDownloading}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4"
              onClick={handlePrintReport}
              disabled={isPrinting}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              {isPrinting ? 'Preparing...' : 'Print Report'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white px-4"
              onClick={handleApplyFilters}
              disabled={!hasAnyFilter}
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {isLoading && <div className="text-white">Loading...</div>}
      {isError && <div className="text-red-400">Error loading orders</div>}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="text-gray-400">No orders found</div>
      )}

      {!isLoading && !isError && orders.length > 0 && (
        <div className="bg-gray-800 rounded-lg overflow-x-auto">
          <div className="grid grid-cols-9 gap-4 p-4 border-b border-gray-600 text-sm bg-[#2c2e33] font-medium text-gray-300 min-w-[900px]">
            <div>Invoice Number</div>
            <div>Date</div>
            <div>Customer Name</div>
            <div>Shop Name</div>
            <div>Area</div>
            <div>Amount</div>
            <div>Due</div>
            <div>Status</div>
            <div>Action</div>
          </div>
          <div className="divide-y divide-gray-600">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className="grid grid-cols-9 gap-4 p-4 items-center hover:bg-gray-700/50 transition-colors min-w-[900px]"
              >
                <div className="text-white font-medium">{order.invoice_number}</div>
                <div className="text-gray-300">{order.date}</div>
                <div className="text-white">{order.full_name}</div>
                <div className="text-gray-300">{order.shopName}</div>
                <div className="text-gray-300">{order.area || '—'}</div>
                <div className="text-white font-medium">{order.amount}</div>
                {(() => {
                  const due = Number(
                    order.due_amount ??
                    ((order.total_amount ?? 0) - (order.collected_amount ?? 0))
                  );
                  return (
                    <div className={`font-medium ${due > 0 ? "text-red-400" : "text-gray-400"}`}>
                      ৳{due.toFixed(2)}
                    </div>
                  );
                })()}
                <div className={getStatusColor(order.status)}>{order.status}</div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(index, 'approve')}
                    className="w-8 h-8 p-0 bg-green-500 hover:bg-green-600 rounded-full"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(index, 'info')}
                    className="w-8 h-8 p-0 bg-purple-500 hover:bg-purple-600 rounded-full"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(index, 'delete')}
                    className="w-8 h-8 p-0 bg-red-500 hover:bg-red-600 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-[#23252b] text-white border-gray-600 max-w-2xl max-h-[800px] overflow-y-auto">
          <DialogHeader></DialogHeader>
          {selectedOrder && (
            <div ref={invoiceRef} className="space-y-2 p-2 bg-white text-black rounded-lg" style={{ fontSize: "16px" }}>
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <img src="/invoicelogo.jpg" alt="Fiha Pharma" className="h-12" />
                </div>
                <h2 className="text-2xl font-bold">{selectedOrder.invoiceNumber}</h2>
              </div>

              {/* Billing Info */}
              <div className="mt-2 space-y-2">
                <div className="invoice-billing grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Bill from:</strong></p>
                    <p>Fiha Pharma</p>
                    <p>Wholesale Supplier</p>
                    <p><strong>Phone</strong>: 01558920438</p>
                    <p><strong>Address</strong>: Holding No-58, Word No-45, Helal Market, Uttar Khan, Uttara, Dhaka-1230</p>
                  </div>
                  <div>
                    <p><strong>Bill to:</strong></p>
                    <p><strong>Name:</strong> {selectedOrder.name || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone || 'N/A'}</p>
                    <p><strong>Area:</strong> {selectedOrder.area || 'N/A'}</p>
                    <p><strong>Shop Name:</strong> {selectedOrder.shopName}</p>
                    <p><strong>Address:</strong> {selectedOrder.shippingAddress || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p><strong>Date:</strong> {selectedOrder.date}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#3b55a0]">
                    <th className="border p-2 border-black text-white text-center align-middle">Sl</th>
                    <th className="border p-2 border-black text-white text-center align-middle">Item</th>
                    <th className="border p-2 border-black text-white text-center align-middle">MRP</th>
                    <th className="border p-2 border-black text-white text-center align-middle">Disc.</th>
                    <th className="border p-2 border-black text-white text-center align-middle">Rate</th>
                    <th className="border p-2 border-black text-white text-center align-middle">Qty</th>
                    <th className="border p-2 border-black text-white text-center align-middle">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="border p-2 border-black text-black text-center">{idx + 1}</td>
                      <td className="border p-2 border-black text-black font-bold">
                        {item.product_name || `Product ID: ${item.product}`}
                      </td>
                      <td className="border p-2 border-black text-black text-right">{item?.mrp ?? 'N/A'}</td>
                      <td className="border p-2 border-black text-black text-right">{item.discount_percent || 'N/A'}%</td>
                      <td className="border p-2 border-black text-black text-right">{item.selling_price || 'N/A'}</td>
                      <td className="border p-2 border-black text-black text-center w-[50px]">{item.quantity}</td>
                      <td className="border p-2 border-black text-black text-right">{item.items_total?.toFixed(2) || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Returned Items Table – only when this invoice has returns */}
              {(selectedOrder.return_items?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <h3 className="text-base font-bold text-red-700 mb-1">Returned Items</h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#b91c1c]">
                        <th className="border p-2 border-black text-white text-center align-middle">Sl</th>
                        <th className="border p-2 border-black text-white text-center align-middle">Item</th>
                        <th className="border p-2 border-black text-white text-center align-middle">MRP</th>
                        <th className="border p-2 border-black text-white text-center align-middle">Disc.</th>
                        <th className="border p-2 border-black text-white text-center align-middle">Rate</th>
                        <th className="border p-2 border-black text-white text-center align-middle">Qty</th>
                        <th className="border p-2 border-black text-white text-center align-middle">Total</th>
                        <th className="border p-2 border-black text-white text-center align-middle">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.return_items?.map((item, idx) => {
                        const lineTotal =
                          item.total_return ?? (Number(item.selling_price) || 0) * item.quantity;
                        return (
                          <tr key={idx} className="border-t">
                            <td className="border p-2 border-black text-black text-center">{idx + 1}</td>
                            <td className="border p-2 border-black text-black font-bold">
                              {item.product_name || `Product ID: ${item.product}`}
                            </td>
                            <td className="border p-2 border-black text-black text-right">{item?.mrp ?? 'N/A'}</td>
                            <td className="border p-2 border-black text-black text-right">{item.discount_percent ?? 'N/A'}%</td>
                            <td className="border p-2 border-black text-black text-right">{item.selling_price ?? 'N/A'}</td>
                            <td className="border p-2 border-black text-black text-center w-[50px]">{item.quantity}</td>
                            <td className="border p-2 border-black text-black text-right">{Number(lineTotal).toFixed(2)}</td>
                            <td className="border p-2 border-black text-black">{item.reason || ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="text-right font-semibold text-red-700 mt-1">
                    Total Returned: {(selectedOrder.total_return_amount ?? 0).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Totals Section – wrap in totals-section */}
              <div className="totals-section mt-2">
                <ul className="divide-y divide-gray-200 p-4 w-full flex flex-col justify-end">
                  <li className="flex justify-between py-2">
                    <span className="text-gray-900 font-medium">Subtotal</span>
                    <span className="text-gray-900">{selectedOrder?.subtotal_amount?.toFixed(2) || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between py-2">
                    <span className="text-gray-900 font-medium">Delivery Charge</span>
                    <span className="text-gray-900">{selectedOrder.delivery_charge?.toFixed(2) || 'N/A'}</span>
                  </li>
                  {/* special bonus discount */}
                  {selectedOrder?.special_bonus_percentage > 0 && selectedOrder?.special_bonus > 0 && (
                    <li className="flex justify-between py-2">
                      <span className="text-gray-900 font-medium">Special Bonus ({selectedOrder?.special_bonus_percentage?.toFixed(2)}%)</span>
                      <span className="text-gray-900">{selectedOrder.special_bonus?.toFixed(2) || 'N/A'}</span>
                    </li>
                  )}
                  <li className="flex justify-between py-2 font-semibold text-lg">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{selectedOrder.amount}</span>
                  </li>
                </ul>
                {/* Terms */}
                <div className="mt-2 text-[11px]">
                  <strong>Terms & Conditions:</strong>
                  <div style={{ marginTop: '4px' }}>
                    {data?.data?.map((term: any, termIndex: number) =>
                      term?.content?.split('\n').filter(Boolean).map((line: string, lineIndex: number) => (
                        <div key={`${termIndex}-${lineIndex}`} style={{ marginBottom: '2px' }}>
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              className="bg-gray-700 hover:bg-gray-600 mr-2 capitalize"
              onClick={handlePrintInvoice}
            >
              print invoice
            </Button>
            <DialogClose asChild>
              <Button className="bg-gray-700 hover:bg-gray-600">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Update Order Status Dialog */}
      <Dialog open={!!statusOrder} onOpenChange={() => setStatusOrder(null)}>
        <DialogContent className="bg-[#23252b] text-white border-gray-600 max-w-xl max-h-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Order Status - ID: {statusOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-400">Select New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value: 'pending' | 'processing' | 'delivered' | 'shipped' | 'cancelled' | 'due') => setNewStatus(value)}
              >
                <SelectTrigger className="w-full bg-[#2c2e33] border-gray-600">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-600">
                  <SelectItem value="pending" className="text-red-400">Pending</SelectItem>
                  <SelectItem value="processing" className="text-orange-400">Processing</SelectItem>
                  <SelectItem value="shipped" className="text-cyan-400">Shipped</SelectItem>
                  <SelectItem value="delivered" className="text-green-400">Delivered</SelectItem>
                  <SelectItem value="cancelled" className="text-gray-400">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-400">Collection (amount collected)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={collectedAmount}
                onChange={(e) => setCollectedAmount(e.target.value)}
                className="bg-[#2c2e33] border-gray-600 text-white mt-1"
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-gray-400">
                  Total: ৳{Number(statusOrder?.total_amount || 0).toFixed(2)}
                </span>
                <span className="text-red-400 font-medium">
                  Due (auto): ৳{(
                    Number(statusOrder?.total_amount || 0) - (Number(collectedAmount) || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-400">Order Items</Label>
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mt-2">
                  <div>
                    <Label className="text-sm text-white">Product</Label>
                    <Input
                      type="text"
                      placeholder="Product name"
                      value={item.product_name}
                      disabled
                      onChange={(e) => handleUpdateItem(index, 'product', parseInt(e.target.value))}
                      className="bg-[#2c2e33] border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-white">Quantity</Label>
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value))}
                      className="bg-[#2c2e33] border-gray-600 text-white"
                    />
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(index)} className="mt-6">
                    X
                  </Button>
                </div>
              ))}

            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStatusOrder(null)} className="bg-gray-700 hover:bg-gray-600">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                className="bg-green-500 hover:bg-green-600"
                disabled={!newStatus || items.some((item) => !item.product || !item.quantity)}
              >
                Update Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmOrder} onOpenChange={() => setDeleteConfirmOrder(null)}>
        <DialogContent className="bg-[#23252b] text-white border-gray-600 max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete Order</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete order {deleteConfirmOrder?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmOrder(null)} className="bg-gray-700 hover:bg-gray-600">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmOrder) {
                  const orderId = parseInt(deleteConfirmOrder.id.replace(/^#/, ''));
                  if (!isNaN(orderId)) handleDelete(orderId);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {orders.length > 0 && renderPagination()}
    </div>
  );
}