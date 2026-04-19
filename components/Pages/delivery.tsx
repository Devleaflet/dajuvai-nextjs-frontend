'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { FiRefreshCw, FiPhoneCall, FiPackage, FiClipboard, FiAlertTriangle, FiPlus, FiArrowLeft, FiLock, FiUpload, FiChevronDown, FiChevronUp, FiTruck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';
import { API_BASE_URL } from '@/lib/config';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryTab = 'processing' | 'warehouse' | 'assignments' | 'riders' | 'recovery';

interface DeliveryActor {
  id?: number;
  username?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  onDelivery?: boolean;
  createdAt?: string;
}

interface DeliveryOrderItem {
  id: number;
  quantity?: number;
  price?: number | string;
  collectedAtWarehouse?: boolean;
  product?: { name?: string } | null;
  variant?: Record<string, unknown> | null;
  vendor?: { businessName?: string; name?: string } | null;
}

interface DeliveryOrderRecord {
  id: number;
  deliveryStatus?: string;
  status?: string;
  totalPrice?: number | string;
  createdAt?: string;
  updatedAt?: string;
  orderedBy?: DeliveryActor | null;
  shippingAddress?: Record<string, unknown> | null;
  orderItems?: DeliveryOrderItem[];
}

interface DeliveryAssignment {
  id: number;
  orderId: number;
  riderId?: number;
  assignmentStatus?: string;
  failureReason?: string;
  createdAt?: string;
  updatedAt?: string;
  order?: DeliveryOrderRecord | null;
  rider?: DeliveryActor | null;
}

interface DeliveryRider {
  id: number;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  onDelivery?: boolean;
  createdAt?: string;
  linkedUserId?: number;
  userId?: number;
  assignments?: DeliveryAssignment[];
}

interface ApiResponse<T> { success: boolean; data: T; message?: string; }
interface ImageUploadResponse { success: boolean; data?: string; msg?: string; message?: string; }
interface DeliveryAssignmentsResponse {
  success: boolean; data?: DeliveryAssignment[]; assignments?: DeliveryAssignment[];
  total?: number; pagination?: { currentPage?: number; totalPages?: number };  message?: string;
}
interface DeliveryWarehouseQueuePayload {
  orders: DeliveryOrderRecord[]; total?: number;
  pagination?: { currentPage?: number; totalPages?: number; total?: number };
}
interface DeliveryWarehouseQueueResponse {
  success?: boolean; data?: DeliveryOrderRecord[] | DeliveryWarehouseQueuePayload;
  orders?: DeliveryOrderRecord[]; total?: number;
  pagination?: { currentPage?: number; totalPages?: number; total?: number }; message?: string;
}

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TAB_CONFIG: Array<{ key: DeliveryTab; label: string; icon: ReactNode }> = [
  { key: 'processing', label: 'Processing', icon: <FiRefreshCw size={15} /> },
  { key: 'warehouse',  label: 'Warehouse',  icon: <FiPackage size={15} /> },
  { key: 'assignments',label: 'Assignments',icon: <FiClipboard size={15} /> },
  { key: 'riders',     label: 'Riders',     icon: <FiTruck size={15} /> },
  { key: 'recovery',   label: 'Recovery',   icon: <FiAlertTriangle size={15} /> },
];

const RIDER_DOCUMENT_MAX_SIZE    = 5 * 1024 * 1024;
const RIDER_DOCUMENT_ACCEPT      = '.jpg,.jpeg,.png,.pdf';
const RIDER_DOCUMENT_UPLOAD_FOLDER = 'riders/documents';

// ─── API ──────────────────────────────────────────────────────────────────────

const createDeliveryAPI = (token: string | null) => {
  const request = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (init.body && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const requestUrl = path.startsWith('http://') || path.startsWith('https://') ? path : `${API_BASE_URL}${path}`;
    const response = await fetch(requestUrl, { ...init, headers: { ...headers, ...(init.headers as Record<string,string> | undefined) }, cache: 'no-store' });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message || `HTTP error! status: ${response.status}`);
    if (result && typeof result === 'object' && 'success' in result && result.success === false)
      throw new Error((result as { message?: string }).message || 'Request failed');
    return result as T;
  };

  return {
    async getProcessingOrders() {
      const r = await request<ApiResponse<Array<Pick<DeliveryOrderRecord,'id'|'deliveryStatus'|'status'>>>>(
        'https://api.dajuvai.com/api/admin/delivery/orders/processing');
      return r.data || [];
    },
    async getProcessingOrderDetails(orderId: number) {
      const r = await request<ApiResponse<DeliveryOrderRecord>>(`/api/admin/delivery/orders/${orderId}/processing`);
      return r.data;
    },
    async markOrderAtWarehouse(orderId: number) {
      const r = await request<ApiResponse<{ id: number; deliveryStatus: string }>>(
        `https://api.dajuvai.com/api/admin/delivery/orders/${orderId}/returned-warehouse`, { method: 'PATCH' });
      return r.data;
    },
    async getWarehouseOrderQueue(page = 1, limit = 20) {
      const response = await request<DeliveryWarehouseQueueResponse>(
        `https://api.dajuvai.com/api/admin/delivery/warehouse-order-queue?page=${page}&limit=${limit}`);
      const rawData = response.data;
      const payload = Array.isArray(rawData)
        ? ({ orders: rawData, total: response.total, pagination: response.pagination } as DeliveryWarehouseQueuePayload)
        : rawData && typeof rawData === 'object'
          ? (rawData as DeliveryWarehouseQueuePayload)
          : ({ orders: response.orders || [], total: response.total, pagination: response.pagination } as DeliveryWarehouseQueuePayload);
      const orders = Array.isArray(payload.orders) ? payload.orders : Array.isArray(response.orders) ? response.orders : [];
      const pagination = payload.pagination || response.pagination || {};
      return {
        orders, total: pagination.total ?? payload.total ?? response.total ?? orders.length,
        pagination: { currentPage: pagination.currentPage ?? page, totalPages: pagination.totalPages ?? 1, total: pagination.total ?? orders.length },
      } as DeliveryWarehouseQueuePayload;
    },
    async getAssignments(page = 1, limit = 20) {
      const r = await request<DeliveryAssignmentsResponse>(
        `https://api.dajuvai.com/api/admin/delivery/assignments?page=${page}&limit=${limit}`);
      return Array.isArray(r.data) ? r.data : Array.isArray(r.assignments) ? r.assignments : [];
    },
    async getAssignmentDetails(orderId: number) {
      const r = await request<ApiResponse<DeliveryAssignment>>(`https://api.dajuvai.com/api/admin/delivery/orders/${orderId}/assignment`);
      return r.data;
    },
    async createAssignment(orderId: number, riderId: number) {
      const r = await request<ApiResponse<DeliveryAssignment>>(
        `https://api.dajuvai.com/api/admin/delivery/orders/${orderId}/assign-rider`,
        { method: 'POST', body: JSON.stringify({ riderId }) });
      return r.data;
    },
    async getRiders() {
      const r = await request<ApiResponse<DeliveryRider[]>>('https://api.dajuvai.com/api/admin/delivery/riders');
      return r.data || [];
    },
    async getRiderDetails(riderId: number) {
      const r = await request<ApiResponse<DeliveryRider>>(`https://api.dajuvai.com/api/admin/delivery/riders/${riderId}`);
      return r.data;
    },
    async createRider(payload: { fullName: string; email: string; phoneNumber: string; password: string; documentUrl?: string }) {
      const r = await request<ApiResponse<DeliveryRider>>('https://api.dajuvai.com/api/admin/delivery/riders', { method: 'POST', body: JSON.stringify(payload) });
      return r.data;
    },
    async uploadRiderDocument(file: File) {
      const formData = new FormData();
      formData.append('file', file);
      const r = await request<ImageUploadResponse>(`${API_BASE_URL}/api/image?folder=${encodeURIComponent(RIDER_DOCUMENT_UPLOAD_FOLDER)}`, { method: 'POST', body: formData });
      if (!r.success || !r.data) throw new Error(r.message || r.msg || 'Failed to upload rider document');
      return r.data;
    },
    async resetRiderPassword(riderId: number, newPassword: string) {
      return request<{ success: boolean; message?: string }>(
        `https://api.dajuvai.com/api/admin/delivery/riders/${riderId}/reset-password`,
        { method: 'PUT', body: JSON.stringify({ newPassword }) });
    },
    async resetOrderToWarehouse(orderId: number) {
      const r = await request<ApiResponse<{ id: number; deliveryStatus: string; status: string }>>(
        `https://api.dajuvai.com/api/admin/delivery/orders/${orderId}/reset-to-warehouse`, { method: 'PATCH' });
      return r.data;
    },
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d?: string) => {
  if (!d) return 'N/A';
  const p = new Date(d);
  if (Number.isNaN(p.getTime())) return 'N/A';
  return p.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (v?: number | string) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseFloat(v) : NaN;
  return `Rs. ${Number.isFinite(n) ? n.toFixed(2) : '0.00'}`;
};

const formatLabel = (v?: string) => {
  if (!v) return 'N/A';
  return v.toLowerCase().split(/[_\s]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
};

const formatDeliveryStatusLabel = (v?: string) => {
  if (!v) return 'N/A';
  if (String(v).toUpperCase() === 'ORDER_PROCESSING') return 'Processing';
  return formatLabel(v);
};

const getCustomerName  = (a?: DeliveryActor | null) => a?.username || a?.fullName || a?.email || 'N/A';
const getCustomerEmail = (a?: DeliveryActor | null) => a?.email || 'N/A';

const formatRiderOptionLabel = (r: DeliveryRider) => {
  const label = r.fullName?.trim() || r.email?.trim() || r.phoneNumber?.trim() || `Rider #${r.id}`;
  const phone = r.phoneNumber?.trim();
  return phone && phone !== label ? `${label} - ${phone}` : label;
};

const getItemCount = (items?: DeliveryOrderItem[]) =>
  Array.isArray(items) ? items.reduce((t, i) => t + Number(i.quantity || 0), 0) : 0;

const getTotalAmount = (order?: DeliveryOrderRecord | null) => {
  const raw = order?.totalPrice;
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseFloat(raw) : NaN;
  if (Number.isFinite(n)) return n;
  if (!Array.isArray(order?.orderItems)) return 0;
  return order!.orderItems!.reduce((s, i) => {
    const p = typeof i.price === 'number' ? i.price : typeof i.price === 'string' ? Number.parseFloat(i.price) : 0;
    return s + p * Number(i.quantity || 0);
  }, 0);
};

const formatShippingAddress = (addr?: Record<string,unknown> | null) => {
  if (!addr) return 'N/A';
  const parts = ['streetAddress','localAddress','town','city','district','state','province','country']
    .map(k => addr[k]).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

const getInitials = (v?: string) => {
  const s = (v || '').trim();
  if (!s) return 'R';
  return s.charAt(0).toUpperCase();
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pill badge for statuses */
function StatusBadge({ status }: { status?: string }) {
  const s = (status || '').toUpperCase();
  let cls = 'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ';
  if (s.includes('PROCESSING') || s.includes('PROCESS')) cls += 'bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.22)]';
  else if (s.includes('WAREHOUSE') || s.includes('AT_WH')) cls += 'bg-orange-100 text-orange-800 ring-1 ring-orange-200';
  else if (s.includes('ASSIGN')) cls += 'bg-white text-orange-700 ring-1 ring-orange-200';
  else if (s.includes('DELIVER')) cls += 'bg-green-50 text-green-700 ring-1 ring-green-200';
  else if (s.includes('FAIL')) cls += 'bg-red-50 text-red-700 ring-1 ring-red-200';
  else cls += 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  return <span className={cls}>{formatDeliveryStatusLabel(status)}</span>;
}

/** Availability badge for riders */
function AvailabilityBadge({ onDelivery }: { onDelivery?: boolean }) {
  return onDelivery
    ? <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(249,115,22,0.2)]"><span className="inline-block h-1.5 w-1.5 rounded-full bg-white/90" />On Delivery</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700"><span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400" />Available</span>;
}

/** Reusable table */
function DataTable({
  columns, rows, emptyMsg, isLoading, showAction = true,
}: {
  columns: string[];
  rows: { key: string | number; cells: ReactNode[]; action?: ReactNode }[];
  emptyMsg: string;
  isLoading?: boolean;
  showAction?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-[28px] border border-orange-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <table className="min-w-full divide-y divide-orange-100 text-sm">
        <thead>
          <tr className="bg-[linear-gradient(180deg,rgba(255,247,237,0.95),rgba(255,255,255,1))]">
            {columns.map(col => (
              <th key={col} className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{col}</th>
            ))}
            {showAction && <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-orange-50">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + (showAction ? 1 : 0)} className="px-4 py-12 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
                  <span className="text-xs">Loading…</span>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (showAction ? 1 : 0)} className="px-4 py-14 text-center text-sm text-slate-400">{emptyMsg}</td>
            </tr>
          ) : rows.map(row => (
            <tr key={row.key} className="transition-colors hover:bg-orange-50/50">
              {row.cells.map((cell, i) => (
                <td key={i} className="px-4 py-3.5 text-slate-700 whitespace-nowrap">{cell}</td>
              ))}
              {showAction && <td className="px-4 py-3 text-right">{row.action ?? '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Order items list inside detail cards */
function OrderItemsList({ items }: { items: DeliveryOrderItem[] | undefined }) {
  if (!items || items.length === 0)
    return <p className="py-3 text-sm text-slate-400">No items found.</p>;
  return (
    <div className="overflow-hidden rounded-[22px] border border-orange-100">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between border-b border-orange-50 bg-white px-4 py-3.5 transition-colors last:border-b-0 hover:bg-orange-50/40">
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{item.product?.name || `Item #${item.id}`}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Qty: {Number(item.quantity || 0)} · {formatCurrency(item.price)}
              {item.vendor?.businessName || item.vendor?.name
                ? ` · ${item.vendor.businessName || item.vendor.name}`
                : null}
            </p>
          </div>
          <span className="ml-4 text-sm font-semibold text-orange-600">
            {formatCurrency((Number(item.price) || 0) * Number(item.quantity || 0))}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Detail grid for order/assignment metadata */
function DetailGrid({ fields }: { fields: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[24px] border border-orange-100 bg-orange-100/70 sm:grid-cols-2">
      {fields.map(f => (
        <div key={f.label} className="bg-white px-4 py-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{f.label}</p>
          <p className="text-sm font-semibold text-slate-800">{f.value}</p>
        </div>
      ))}
    </div>
  );
}

/** Back button */
function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
    >
      <FiArrowLeft size={14} /> {label}
    </button>
  );
}

/** Section card wrapper */
function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[30px] border border-orange-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

/** Form field wrapper */
function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-600">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-2xl border border-orange-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
  const { token } = useAuth();
  const deliveryAPI = useMemo(() => createDeliveryAPI(token), [token]);

  const [activeTab, setActiveTab]                   = useState<DeliveryTab>('processing');
  const [processingOrders, setProcessingOrders]     = useState<DeliveryOrderRecord[]>([]);
  const [warehouseOrders, setWarehouseOrders]       = useState<DeliveryOrderRecord[]>([]);
  const [warehousePage, setWarehousePage]           = useState(1);
  const [warehousePagination, setWarehousePagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [warehouseExpanded, setWarehouseExpanded]   = useState<Record<number,boolean>>({});
  const [warehouseRiderSel, setWarehouseRiderSel]   = useState<Record<number,string>>({});
  const [assignments, setAssignments]               = useState<DeliveryAssignment[]>([]);
  const [riders, setRiders]                         = useState<DeliveryRider[]>([]);

  const [selectedOrder, setSelectedOrder]           = useState<DeliveryOrderRecord | null>(null);
  const [selectedRider, setSelectedRider]           = useState<DeliveryRider | null>(null);

  const [isRefreshing, setIsRefreshing]                   = useState(false);
  const [isDetailLoading, setIsDetailLoading]             = useState(false);
  const [isRiderDetailLoading, setIsRiderDetailLoading]   = useState(false);

  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateRider, setShowCreateRider]           = useState(false);

  const [assignForm, setAssignForm] = useState({ orderId: '', riderId: '' });
  const [riderForm, setRiderForm]   = useState({ fullName: '', email: '', phoneNumber: '', password: '' });
  const [riderDoc, setRiderDoc]     = useState<File | null>(null);
  const [riderDocKey, setRiderDocKey] = useState(0);
  const [pwForm, setPwForm]         = useState({ newPassword: '' });
  const [actionKey, setActionKey]   = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadProcessingOrders = useCallback(async () => {
    if (!token) { setProcessingOrders([]); setError('Please log in.'); return; }
    setIsRefreshing(true); setError(null);
    try {
      const summaries = await deliveryAPI.getProcessingOrders();
      const details = await Promise.all(summaries.map(async s => {
        try {
          const d = await deliveryAPI.getProcessingOrderDetails(s.id);
          return { ...d, ...(d.deliveryStatus !== undefined ? { deliveryStatus: d.deliveryStatus } : {}), ...(d.status !== undefined ? { status: d.status } : {}) };
        } catch {
          return { id: s.id, deliveryStatus: s.deliveryStatus, status: s.status, orderItems: [] } as DeliveryOrderRecord;
        }
      }));
      setProcessingOrders(details.sort((a,b) => new Date(b.createdAt||b.updatedAt||0).getTime() - new Date(a.createdAt||a.updatedAt||0).getTime()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load processing orders');
      setProcessingOrders([]);
    } finally { setIsRefreshing(false); }
  }, [deliveryAPI, token]);

  const loadWarehouseOrders = useCallback(async (page = warehousePage) => {
    if (!token) { setWarehouseOrders([]); setWarehousePagination({ currentPage:1,totalPages:1,total:0 }); setError('Please log in.'); return; }
    setIsRefreshing(true); setError(null);
    try {
      const payload = await deliveryAPI.getWarehouseOrderQueue(page, 20);
      const sorted  = (payload.orders||[]).sort((a,b)=>new Date(b.updatedAt||b.createdAt||0).getTime()-new Date(a.updatedAt||a.createdAt||0).getTime());
      setWarehouseOrders(sorted);
      setWarehousePage(payload.pagination?.currentPage ?? page);
      setWarehousePagination({ currentPage: payload.pagination?.currentPage??page, totalPages: payload.pagination?.totalPages??1, total: payload.pagination?.total??sorted.length });
      setWarehouseExpanded({}); setWarehouseRiderSel({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load warehouse queue');
      setWarehouseOrders([]); setWarehousePagination({ currentPage:1,totalPages:1,total:0 });
    } finally { setIsRefreshing(false); }
  }, [deliveryAPI, token, warehousePage]);

  const loadAssignments = useCallback(async () => {
    if (!token) { setAssignments([]); setError('Please log in.'); return; }
    setIsRefreshing(true); setError(null);
    try {
      const data = await deliveryAPI.getAssignments(1,20);
      setAssignments([...data].sort((a,b)=>new Date(b.createdAt||b.updatedAt||0).getTime()-new Date(a.createdAt||a.updatedAt||0).getTime()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
      setAssignments([]);
    } finally { setIsRefreshing(false); }
  }, [deliveryAPI, token]);

  const loadRiders = useCallback(async () => {
    if (!token) { setRiders([]); setError('Please log in.'); return; }
    setIsRefreshing(true); setError(null);
    try { setRiders(await deliveryAPI.getRiders()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load riders'); setRiders([]); }
    finally { setIsRefreshing(false); }
  }, [deliveryAPI, token]);

  const refreshActiveTab = useCallback(async () => {
    switch (activeTab) {
      case 'processing':                     await loadProcessingOrders(); break;
      case 'warehouse':                      await loadWarehouseOrders();  break;
      case 'assignments': case 'recovery':   await loadAssignments();      break;
      case 'riders':                         await loadRiders();            break;
    }
  }, [activeTab, loadAssignments, loadProcessingOrders, loadRiders, loadWarehouseOrders]);

  useEffect(() => { void refreshActiveTab(); }, [refreshActiveTab]);

  useEffect(() => {
    setSelectedOrder(null); setSelectedRider(null);
    setIsDetailLoading(false); setIsRiderDetailLoading(false);
    setShowCreateAssignment(false); setShowCreateRider(false);
    setRiderForm({ fullName:'',email:'',phoneNumber:'',password:'' });
    setRiderDoc(null); setRiderDocKey(k=>k+1); setPwForm({ newPassword:'' });
    setWarehouseExpanded({}); setWarehouseRiderSel({});
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'warehouse' || !token || riders.length > 0) return;
    let mounted = true;
    void (async () => {
      try { const d = await deliveryAPI.getRiders(); if (mounted) setRiders(d); } catch {}
    })();
    return () => { mounted = false; };
  }, [activeTab, deliveryAPI, riders.length, token]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleViewOrder = useCallback(async (id: number) => {
    if (!token) { toast.error('Auth required'); return; }
    setIsDetailLoading(true);
    try { setSelectedOrder(await deliveryAPI.getProcessingOrderDetails(id)); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to load order'); }
    finally { setIsDetailLoading(false); }
  }, [deliveryAPI, token]);

  const handleViewRider = useCallback(async (id: number) => {
    if (!token) { toast.error('Auth required'); return; }
    setIsRiderDetailLoading(true); setShowCreateRider(false);
    try { setSelectedRider(await deliveryAPI.getRiderDetails(id)); setPwForm({ newPassword:'' }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to load rider'); }
    finally { setIsRiderDetailLoading(false); }
  }, [deliveryAPI, token]);

  const handleMoveToWarehouse = useCallback(async (id: number) => {
    if (!token) { toast.error('Auth required'); return; }
    setActionKey(`processing-${id}`);
    try {
      await deliveryAPI.markOrderAtWarehouse(id);
      toast.success('Order moved to warehouse');
      await loadProcessingOrders();
      setSelectedOrder(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionKey(null); }
  }, [deliveryAPI, loadProcessingOrders, token]);

  const handleMarkWarehouseOrder = useCallback(async (id: number) => {
    if (!token) { toast.error('Auth required'); return; }
    setActionKey(`wh-mark-${id}`);
    try {
      await deliveryAPI.markOrderAtWarehouse(id);
      toast.success('Marked at warehouse');
      await loadWarehouseOrders(warehousePage);
      await loadAssignments();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionKey(null); }
  }, [deliveryAPI, loadAssignments, loadWarehouseOrders, token, warehousePage]);

  const handleAssignRider = useCallback(async (orderId: number) => {
    if (!token) { toast.error('Auth required'); return; }
    const riderId = Number.parseInt(warehouseRiderSel[orderId]||'', 10);
    if (!Number.isFinite(riderId)||riderId<=0) { toast.error('Select a rider first'); return; }
    setActionKey(`wh-assign-${orderId}`);
    try {
      await deliveryAPI.createAssignment(orderId, riderId);
      toast.success('Rider assigned');
      setWarehouseRiderSel(s=>({ ...s, [orderId]:'' }));
      await loadWarehouseOrders(warehousePage);
      await loadAssignments();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionKey(null); }
  }, [deliveryAPI, loadAssignments, loadWarehouseOrders, token, warehousePage, warehouseRiderSel]);

  const handleCreateAssignment = useCallback(async () => {
    if (!token) { toast.error('Auth required'); return; }
    const orderId = Number.parseInt(assignForm.orderId,10);
    const riderId = Number.parseInt(assignForm.riderId,10);
    if (!Number.isFinite(orderId)||orderId<=0) { toast.error('Enter a valid order ID'); return; }
    if (!Number.isFinite(riderId)||riderId<=0) { toast.error('Select a rider'); return; }
    setActionKey('assign-create');
    try {
      await deliveryAPI.createAssignment(orderId, riderId);
      toast.success('Assignment created');
      setAssignForm({ orderId:'', riderId:'' });
      setShowCreateAssignment(false);
      await loadAssignments();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionKey(null); }
  }, [assignForm, deliveryAPI, loadAssignments, token]);

  const handleCreateRider = useCallback(async () => {
    if (!token) { toast.error('Auth required'); return; }
    const { fullName, email, phoneNumber, password } = riderForm;
    if (!fullName.trim()) { toast.error('Enter the rider name'); return; }
    if (!email.trim())    { toast.error('Enter the rider email'); return; }
    if (!phoneNumber.trim() || !/^\d{10}$/.test(phoneNumber.trim())) { toast.error('Phone must be 10 digits'); return; }
    if (!password || password.length < 8) { toast.error('Password must be 8+ chars'); return; }
    if (riderDoc && riderDoc.size > RIDER_DOCUMENT_MAX_SIZE) { toast.error('Doc max 5 MB'); return; }
    setActionKey('rider-create');
    try {
      const documentUrl = riderDoc ? await deliveryAPI.uploadRiderDocument(riderDoc) : undefined;
      await deliveryAPI.createRider({ fullName: fullName.trim(), email: email.trim(), phoneNumber: phoneNumber.trim(), password, ...(documentUrl?{documentUrl}:{}) });
      toast.success('Rider created');
      setRiderForm({ fullName:'',email:'',phoneNumber:'',password:'' });
      setRiderDoc(null); setRiderDocKey(k=>k+1);
      setShowCreateRider(false);
      await loadRiders();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionKey(null); }
  }, [deliveryAPI, loadRiders, riderDoc, riderForm, token]);

  const handleResetRiderPassword = useCallback(async () => {
    if (!token||!selectedRider) { toast.error('Auth required'); return; }
    const np = pwForm.newPassword.trim();
    if (!np) { toast.error('Enter a new password'); return; }
    setActionKey(`rider-pw-${selectedRider.id}`);
    try { await deliveryAPI.resetRiderPassword(selectedRider.id, np); toast.success('Password reset'); setPwForm({ newPassword:'' }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionKey(null); }
  }, [deliveryAPI, pwForm.newPassword, selectedRider, token]);

  const handleResetToWarehouse = useCallback(async (orderId: number) => {
    if (!token) { toast.error('Auth required'); return; }
    setActionKey(`recovery-${orderId}`);
    try { await deliveryAPI.resetOrderToWarehouse(orderId); toast.success('Order reset to warehouse'); await loadAssignments(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionKey(null); }
  }, [deliveryAPI, loadAssignments, token]);

  const recoveryAssignments = useMemo(
    () => assignments.filter(a => String(a.assignmentStatus||'').toUpperCase()==='FAILED'),
    [assignments],
  );

  const visiblePages = useMemo(() => {
    const total = warehousePagination.totalPages || 1;
    const cur   = warehousePagination.currentPage || 1;
    if (total <= 5) return Array.from({ length: total }, (_,i) => i+1);
    let start = Math.max(1, cur-2);
    const end = Math.min(total, start+4);
    if (end-start < 4) start = Math.max(1, end-4);
    return Array.from({ length: end-start+1 }, (_,i) => start+i);
  }, [warehousePagination]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/70 px-4 py-6 sm:px-6">

      {/* ── Tabs ── */}
      <div className="mb-6 flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm border border-gray-100 w-fit max-w-full overflow-x-auto">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50',
            ].join(' ')}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Processing Orders ── */}
      {activeTab === 'processing' && (
        selectedOrder || isDetailLoading ? (
          <SectionCard>
            <BackButton onClick={() => setSelectedOrder(null)} label="Back to processing orders" />
            {isDetailLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                <span className="text-sm">Loading order details…</span>
              </div>
            ) : selectedOrder && (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Order <span className="text-blue-600">#{selectedOrder.id}</span></h2>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(selectedOrder.createdAt || selectedOrder.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedOrder.deliveryStatus || selectedOrder.status || 'ORDER_PROCESSING'} />
                    <button
                      type="button"
                      onClick={() => void handleMoveToWarehouse(selectedOrder.id)}
                      disabled={actionKey === `processing-${selectedOrder.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      <FiPackage size={13} />
                      {actionKey === `processing-${selectedOrder.id}` ? 'Moving…' : 'Move to Warehouse'}
                    </button>
                  </div>
                </div>
                <DetailGrid fields={[
                  { label: 'Customer',         value: getCustomerName(selectedOrder.orderedBy) },
                  { label: 'Email',            value: getCustomerEmail(selectedOrder.orderedBy) },
                  { label: 'Total',            value: <span className="text-blue-700">{formatCurrency(getTotalAmount(selectedOrder))}</span> },
                  { label: 'Shipping Address', value: formatShippingAddress(selectedOrder.shippingAddress) },
                ]} />
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h3>
                  <OrderItemsList items={selectedOrder.orderItems} />
                </div>
              </>
            )}
          </SectionCard>
        ) : (
          <>
            <TabHeader title="Processing Orders" subtitle={`${processingOrders.length} order(s)`} isRefreshing={isRefreshing} onRefresh={() => void refreshActiveTab()} />
            <DataTable
              isLoading={isRefreshing && processingOrders.length === 0}
              columns={['Order ID','Customer','Items','Total','Status','Date']}
              emptyMsg={error || 'No processing orders found.'}
              rows={processingOrders.map(o => ({
                key: o.id,
                cells: [
                  <span key="id" className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">#{o.id}</span>,
                  <div key="customer"><p className="text-sm font-medium text-gray-800">{getCustomerName(o.orderedBy)}</p><p className="text-xs text-gray-400">{getCustomerEmail(o.orderedBy)}</p></div>,
                  <span key="items" className="text-gray-600">{getItemCount(o.orderItems)} item(s)</span>,
                  <span key="total" className="font-medium text-gray-800">{formatCurrency(getTotalAmount(o))}</span>,
                  <StatusBadge key="status" status={o.deliveryStatus || o.status || 'ORDER_PROCESSING'} />,
                  <span key="date" className="text-gray-500 text-xs">{formatDate(o.createdAt || o.updatedAt)}</span>,
                ],
                action: (
                  <button type="button" onClick={() => void handleViewOrder(o.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition">
                    View Items
                  </button>
                ),
              }))}
            />
          </>
        )
      )}

      {/* ── Warehouse Queue ── */}
      {activeTab === 'warehouse' && (
        <>
          <TabHeader title="Warehouse Queue" subtitle={`${warehouseOrders.length} order(s)`} isRefreshing={isRefreshing} onRefresh={() => void refreshActiveTab()} />
          {isRefreshing && warehouseOrders.length === 0 ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : warehouseOrders.length === 0 ? (
            <EmptyState icon={<FiPackage size={28} />} message="No orders in the warehouse queue." />
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {warehouseOrders.map(order => {
                  const isMarking  = actionKey === `wh-mark-${order.id}`;
                  const isAssigning= actionKey === `wh-assign-${order.id}`;
                  const expanded   = Boolean(warehouseExpanded[order.id]);
                  const selRider   = warehouseRiderSel[order.id] || '';
                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      {/* Card header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg">#{order.id}</span>
                          <StatusBadge status={order.deliveryStatus || 'AT_WAREHOUSE'} />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleMarkWarehouseOrder(order.id)}
                            disabled={isMarking}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                          >
                            <FiPackage size={12} />
                            {isMarking ? 'Working…' : 'Mark at Warehouse'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWarehouseExpanded(s=>({ ...s,[order.id]:!s[order.id] }))}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition"
                          >
                            {expanded ? <FiChevronUp size={12}/> : <FiChevronDown size={12}/>}
                            {expanded ? 'Hide' : 'Details'}
                          </button>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="px-5 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                          {[
                            { label: 'Customer', val: getCustomerName(order.orderedBy) },
                            { label: 'Email',    val: getCustomerEmail(order.orderedBy) },
                            { label: 'Total',    val: formatCurrency(getTotalAmount(order)) },
                            { label: 'Address',  val: formatShippingAddress(order.shippingAddress) },
                          ].map(f => (
                            <div key={f.label}>
                              <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide font-medium">{f.label}</p>
                              <p className="text-gray-800 font-medium truncate">{f.val}</p>
                            </div>
                          ))}
                        </div>

                        {/* Assign row */}
                        <div className="flex gap-2 items-center">
                          <select
                            value={selRider}
                            onChange={e => setWarehouseRiderSel(s=>({ ...s,[order.id]:e.target.value }))}
                            className={`${inputCls} flex-1 min-w-0`}
                          >
                            <option value="">Select Rider…</option>
                            {riders.map(r => <option key={r.id} value={r.id}>{formatRiderOptionLabel(r)}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleAssignRider(order.id)}
                            disabled={!riders.length || !selRider || isAssigning || isMarking}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-40 transition whitespace-nowrap"
                          >
                            <FiTruck size={12} />
                            {isAssigning ? 'Assigning…' : 'Assign Rider'}
                          </button>
                        </div>
                        {!riders.length && <p className="text-xs text-amber-600 mt-2">No riders available. Create riders first.</p>}
                      </div>

                      {/* Expandable items */}
                      {expanded && (
                        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Items</h4>
                          <OrderItemsList items={order.orderItems} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Page {warehousePagination.currentPage} of {warehousePagination.totalPages}
                  <span className="ml-2 text-gray-400">({warehousePagination.total} total)</span>
                </p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => void loadWarehouseOrders(warehousePagination.currentPage-1)} disabled={warehousePagination.currentPage<=1||isRefreshing} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">‹ Prev</button>
                  {visiblePages.map(p => (
                    <button key={p} type="button" onClick={() => void loadWarehouseOrders(p)} disabled={isRefreshing}
                      className={['px-3 py-1.5 rounded-lg border text-xs transition',
                        p===warehousePagination.currentPage ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                      ].join(' ')}
                    >{p}</button>
                  ))}
                  <button type="button" onClick={() => void loadWarehouseOrders(warehousePagination.currentPage+1)} disabled={warehousePagination.currentPage>=warehousePagination.totalPages||isRefreshing} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">Next ›</button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── All Assignments ── */}
      {activeTab === 'assignments' && (
        showCreateAssignment ? (
          <SectionCard>
            <BackButton onClick={() => setShowCreateAssignment(false)} label="Back to assignments" />
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Create Assignment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <FormField label="Order ID" required>
                <input type="number" value={assignForm.orderId} onChange={e => setAssignForm(s=>({ ...s,orderId:e.target.value }))} className={inputCls} placeholder="e.g. 1042" min="1" />
              </FormField>
              <FormField label="Rider" required>
                {riders.length > 0
                  ? <select value={assignForm.riderId} onChange={e => setAssignForm(s=>({ ...s,riderId:e.target.value }))} className={inputCls}>
                      <option value="">Select rider…</option>
                      {riders.map(r => <option key={r.id} value={r.id}>#{r.id} {r.fullName||r.email||r.phoneNumber||'Rider'}</option>)}
                    </select>
                  : <input type="number" value={assignForm.riderId} onChange={e => setAssignForm(s=>({ ...s,riderId:e.target.value }))} className={inputCls} placeholder={isRefreshing?'Loading riders…':'Rider ID'} min="1" />
                }
              </FormField>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setShowCreateAssignment(false)} disabled={actionKey==='assign-create'} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition">Cancel</button>
              <button type="button" onClick={() => void handleCreateAssignment()} disabled={actionKey==='assign-create'} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                {actionKey==='assign-create' ? 'Creating…' : 'Create Assignment'}
              </button>
            </div>
          </SectionCard>
        ) : (
          <>
            <TabHeader title="All Assignments" subtitle={`${assignments.length} assignment(s)`} />
            <DataTable
              isLoading={isRefreshing && assignments.length === 0}
              columns={['Assignment','Order ID','Rider','Phone','Status','Assigned At','Failure Reason']}
              showAction={false}
              emptyMsg={error || 'No assignments found.'}
              rows={assignments.map(a => ({
                key: a.id,
                cells: [
                  <span key="id" className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">#{a.id}</span>,
                  <span key="order" className="text-gray-600 text-xs">#{a.orderId}</span>,
                  <span key="rider" className="font-medium text-gray-800">{a.rider?.fullName||a.rider?.username||a.rider?.email||'Unassigned'}</span>,
                  <span key="phone" className="text-gray-500 text-xs">{a.rider?.phoneNumber||'N/A'}</span>,
                  <StatusBadge key="status" status={a.assignmentStatus||'ASSIGNED'} />,
                  <span key="date" className="text-gray-500 text-xs">{formatDate(a.createdAt||a.updatedAt)}</span>,
                  <span key="failure" className="text-gray-400 text-xs">{a.failureReason||'—'}</span>,
                ],
              }))}
            />
          </>
        )
      )}

      {/* ── Riders ── */}
      {activeTab === 'riders' && (
        isRiderDetailLoading || selectedRider ? (
          <SectionCard>
            <BackButton onClick={() => setSelectedRider(null)} label="Back to riders" />
            {isRiderDetailLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
                <span className="text-sm">Loading rider details…</span>
              </div>
            ) : selectedRider && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="avatar w-14 h-14 text-xl font-semibold" style={{ background:'#dbeafe',color:'#1d4ed8',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    {getInitials(selectedRider.fullName||selectedRider.email)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{selectedRider.fullName||`Rider #${selectedRider.id}`}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5"><FiPhoneCall size={12}/>{selectedRider.phoneNumber||'N/A'}</p>
                    <AvailabilityBadge onDelivery={selectedRider.onDelivery} />
                  </div>
                </div>
                <DetailGrid fields={[
                  { label: 'Rider ID',       value: <span className="font-mono">#{selectedRider.id}</span> },
                  { label: 'Email',          value: selectedRider.email||'N/A' },
                  { label: 'Linked User ID', value: selectedRider.linkedUserId??selectedRider.userId ? `#${selectedRider.linkedUserId??selectedRider.userId}` : 'N/A' },
                  { label: 'Created',        value: formatDate(selectedRider.createdAt) },
                ]} />
                <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5"><FiLock size={12}/>Reset Password</p>
                  <div className="flex gap-2">
                    <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ newPassword:e.target.value })} className={`${inputCls} flex-1`} placeholder="Enter new password…" />
                    <button type="button" onClick={() => void handleResetRiderPassword()} disabled={actionKey===`rider-pw-${selectedRider.id}`} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap">
                      {actionKey===`rider-pw-${selectedRider.id}` ? 'Saving…' : 'Change'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </SectionCard>
        ) : showCreateRider ? (
          <SectionCard>
            <BackButton onClick={() => { setShowCreateRider(false); }} label="Back to riders" />
            <h2 className="text-lg font-semibold text-gray-800 mb-5">New Rider</h2>
            <form id="create-rider-form" autoComplete="off" onSubmit={e => { e.preventDefault(); void handleCreateRider(); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <FormField label="Full Name" required>
                <input type="text" data-field="fullName" value={riderForm.fullName} onChange={e => setRiderForm(s=>({ ...s,fullName:e.target.value }))} className={inputCls} placeholder="e.g. Ram Bahadur" autoComplete="off" />
              </FormField>
              <FormField label="Phone Number" required>
                <input type="text" data-field="phoneNumber" value={riderForm.phoneNumber} onChange={e => setRiderForm(s=>({ ...s,phoneNumber:e.target.value }))} className={inputCls} placeholder="98XXXXXXXX" inputMode="numeric" autoComplete="off" />
              </FormField>
              <FormField label="Email" required>
                <input type="email" data-field="email" value={riderForm.email} onChange={e => setRiderForm(s=>({ ...s,email:e.target.value }))} className={inputCls} placeholder="rider@example.com" autoComplete="off" />
              </FormField>
              <FormField label="Password" required>
                <input type="password" data-field="password" value={riderForm.password} onChange={e => setRiderForm(s=>({ ...s,password:e.target.value }))} className={inputCls} placeholder="Min 8 characters" autoComplete="new-password" />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Document (optional)">
                  <label className="flex items-center gap-3 cursor-pointer border border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition">
                    <FiUpload size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500 truncate">{riderDoc?.name || 'Choose a file (JPG, PNG, PDF · max 5 MB)'}</span>
                    <input key={riderDocKey} type="file" accept={RIDER_DOCUMENT_ACCEPT} className="hidden" onChange={e => {
                      const f = e.target.files?.[0]||null;
                      if (!f) { setRiderDoc(null); return; }
                      if (!/\.(jpg|jpeg|png|pdf)$/i.test(f.name)) { toast.error('Only JPG, PNG, PDF allowed'); setRiderDocKey(k=>k+1); return; }
                      if (f.size > RIDER_DOCUMENT_MAX_SIZE) { toast.error('Max 5 MB'); setRiderDocKey(k=>k+1); return; }
                      setRiderDoc(f);
                    }} />
                  </label>
                </FormField>
              </div>
            </form>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setShowCreateRider(false)} disabled={actionKey==='rider-create'} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition">Cancel</button>
              <button type="submit" form="create-rider-form" disabled={actionKey==='rider-create'} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                {actionKey==='rider-create' ? 'Creating…' : 'Create Rider'}
              </button>
            </div>
          </SectionCard>
        ) : (
          <>
            <TabHeader title={`Riders (${riders.length})`} subtitle="Manage delivery riders" isRefreshing={isRefreshing} onRefresh={() => void refreshActiveTab()}>
              <button type="button" onClick={() => { setSelectedRider(null); setShowCreateRider(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                <FiPlus size={14} /> New Rider
              </button>
            </TabHeader>
            {riders.length === 0 ? (
              <EmptyState icon={<FiTruck size={28}/>} message="No riders found. Add one to get started." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {riders.map(rider => (
                  <button
                    key={rider.id}
                    type="button"
                    onClick={() => void handleViewRider(rider.id)}
                    className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 hover:bg-blue-50/50 hover:shadow transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-semibold group-hover:bg-blue-200 transition">
                      {getInitials(rider.fullName||rider.email)}
                    </div>
                    <div className="text-center min-w-0 w-full">
                      <p className="text-sm font-medium text-gray-800 truncate">{rider.fullName||'Unnamed'}</p>
                      <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-0.5 truncate">
                        <FiPhoneCall size={10}/>{rider.phoneNumber||'N/A'}
                      </p>
                    </div>
                    <AvailabilityBadge onDelivery={rider.onDelivery} />
                    <p className="text-xs text-gray-300">ID #{rider.id}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )
      )}

      {/* ── Failed Recovery ── */}
      {activeTab === 'recovery' && (
        <>
          <TabHeader title="Failed Recovery" subtitle={`${recoveryAssignments.length} failed delivery(s)`} isRefreshing={isRefreshing} onRefresh={() => void refreshActiveTab()} />
          <DataTable
            isLoading={isRefreshing && assignments.length === 0}
            columns={['Assignment','Order ID','Customer','Failure Reason','Status','Updated']}
            emptyMsg={error || 'No failed deliveries.'}
            rows={recoveryAssignments.map(a => ({
              key: a.id,
              cells: [
                <span key="id" className="font-mono text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-md">#{a.id}</span>,
                <span key="order" className="text-gray-600 text-xs">#{a.orderId}</span>,
                <span key="customer" className="font-medium text-gray-800">{getCustomerName(a.order?.orderedBy)}</span>,
                <span key="failure" className="text-red-600 text-xs">{a.failureReason||'Failed delivery'}</span>,
                <StatusBadge key="status" status={a.assignmentStatus||a.order?.deliveryStatus||'FAILED'} />,
                <span key="date" className="text-gray-500 text-xs">{formatDate(a.updatedAt||a.createdAt)}</span>,
              ],
              action: (
                <button type="button" onClick={() => void handleResetToWarehouse(a.orderId)} disabled={actionKey===`recovery-${a.orderId}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                  {actionKey===`recovery-${a.orderId}` ? 'Working…' : 'Reset Order'}
                </button>
              ),
            }))}
          />
        </>
      )}
    </div>
  );
}

// ─── Local helper components ───────────────────────────────────────────────────

function TabHeader({
  title, subtitle, isRefreshing, onRefresh, children,
}: { title: string; subtitle?: string; isRefreshing?: boolean; onRefresh?: () => void; children?: ReactNode }) {
  const hasActions = Boolean(children) || Boolean(onRefresh);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {hasActions ? (
        <div className="flex items-center gap-2">
          {children}
          {onRefresh && (
            <button type="button" onClick={onRefresh} disabled={isRefreshing} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm">
              <FiRefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300 bg-white rounded-2xl border border-gray-100">
      <span className="text-gray-200">{icon}</span>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
