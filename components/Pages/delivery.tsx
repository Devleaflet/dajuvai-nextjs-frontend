'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  FiRefreshCw,
  FiPhoneCall,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';
import { API_BASE_URL } from '@/lib/config';
import '@/styles/Delivery.css';

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
  product?: {
    name?: string;
  } | null;
  variant?: Record<string, unknown> | null;
  vendor?: {
    businessName?: string;
    name?: string;
  } | null;
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

interface DeliveryTableAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

interface DeliveryTableRow {
  key: number | string;
  cells: ReactNode[];
  action?: DeliveryTableAction;
  actions?: DeliveryTableAction[];
}

interface DeliveryTableConfig {
  columns: string[];
  rows: DeliveryTableRow[];
  emptyMessage: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface DeliveryAssignmentsResponse {
  success: boolean;
  assignments: DeliveryAssignment[];
  total?: number;
  pagination?: {
    currentPage?: number;
    totalPages?: number;
  };
  message?: string;
}

interface DeliveryWarehouseQueuePayload {
  orders: DeliveryOrderRecord[];
  total?: number;
  pagination?: {
    currentPage?: number;
    totalPages?: number;
  };
}

const TAB_CONFIG: Array<{ key: DeliveryTab; label: string; icon: ReactNode }> = [
  { key: 'processing', label: 'Processing Orders', icon: <span aria-hidden="true">🔄</span> },
  { key: 'warehouse', label: 'Warehouse Queue', icon: <span aria-hidden="true">📦</span> },
  { key: 'assignments', label: 'All Assignments', icon: <span aria-hidden="true">📋</span> },
  { key: 'riders', label: 'Riders', icon: <span aria-hidden="true">🛵</span> },
  { key: 'recovery', label: 'Failed Recovery', icon: <span aria-hidden="true">⚠️</span> },
];

const createDeliveryAPI = (token: string | null) => {
  const request = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (init.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestUrl =
      path.startsWith('http://') || path.startsWith('https://')
        ? path
        : `${API_BASE_URL}${path}`;

    const response = await fetch(requestUrl, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers as Record<string, string> | undefined),
      },
      cache: 'no-store',
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || `HTTP error! status: ${response.status}`);
    }

    if (result && typeof result === 'object' && 'success' in result && result.success === false) {
      throw new Error((result as { message?: string }).message || 'Request failed');
    }

    return result as T;
  };

  return {
    async getProcessingOrders() {
      const response = await request<
        ApiResponse<Array<Pick<DeliveryOrderRecord, 'id' | 'deliveryStatus' | 'status'>>>
      >('https://api.dajuvai.com/api/delivery/orders/processing');
      return response.data || [];
    },

    async getProcessingOrderDetails(orderId: number) {
      const response = await request<ApiResponse<DeliveryOrderRecord>>(
        `/api/delivery/orders/${orderId}/processing`
      );
      return response.data;
    },

    async markOrderAtWarehouse(orderId: number) {
      const response = await request<ApiResponse<{ id: number; deliveryStatus: string }>>(
        `https://api.dajuvai.com/api/delivery/orders/${orderId}/returned-warehouse`,
        { method: 'PATCH' }
      );
      return response.data;
    },

    async collectOrderItem(orderItemId: number) {
      return request<{ success: boolean; message?: string }>(
        `/api/delivery/orders/orderItems/${orderItemId}/collect-items`,
        { method: 'PUT' }
      );
    },

    async getWarehouseOrderQueue(page = 1, limit = 20) {
      const response = await request<ApiResponse<DeliveryWarehouseQueuePayload>>(
        `https://api.dajuvai.com/api/delivery/warehouse-order-queue?page=${page}&limit=${limit}`
      );
      return response.data;
    },

    async getAssignments(page = 1, limit = 20) {
      const response = await request<DeliveryAssignmentsResponse>(
        `https://api.dajuvai.com/api/delivery/assignments?page=${page}&limit=${limit}`
      );
      return response.assignments || [];
    },

    async getAssignmentDetails(orderId: number) {
      const response = await request<ApiResponse<DeliveryAssignment>>(
        `https://api.dajuvai.com/api/delivery/orders/${orderId}/assignment`
      );
      return response.data;
    },

    async createAssignment(orderId: number, riderId: number) {
      const response = await request<ApiResponse<DeliveryAssignment>>(
        `https://api.dajuvai.com/api/delivery/orders/${orderId}/assign-rider`,
        {
          method: 'POST',
          body: JSON.stringify({ riderId }),
        }
      );
      return response.data;
    },

    async getRiders() {
      const response = await request<ApiResponse<DeliveryRider[]>>(
        'https://api.dajuvai.com/api/delivery/riders'
      );
      return response.data || [];
    },

    async getRiderDetails(riderId: number) {
      const response = await request<ApiResponse<DeliveryRider>>(
        `https://api.dajuvai.com/api/delivery/riders/${riderId}`
      );
      return response.data;
    },

    async createRider(payload: {
      fullName: string;
      email: string;
      phoneNumber: string;
      password: string;
    }) {
      const response = await request<ApiResponse<DeliveryRider>>(
        'https://api.dajuvai.com/api/delivery/riders',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      return response.data;
    },

    async resetRiderPassword(riderId: number, newPassword: string) {
      return request<{ success: boolean; message?: string }>(
        `https://api.dajuvai.com/api/delivery/riders/${riderId}/reset-password`,
        {
          method: 'PUT',
          body: JSON.stringify({ newPassword }),
        }
      );
    },

    async resetOrderToWarehouse(orderId: number) {
      const response = await request<ApiResponse<{ id: number; deliveryStatus: string; status: string }>>(
        `https://api.dajuvai.com/api/delivery/orders/${orderId}/reset-to-warehouse`,
        { method: 'PATCH' }
      );
      return response.data;
    },
  };
};

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return 'N/A';
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (value?: number | string) => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;

  return `Rs. ${Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'}`;
};

const formatLabel = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDeliveryStatusLabel = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  const normalized = String(value).toUpperCase();
  if (normalized === 'ORDER_PROCESSING') {
    return 'Processing';
  }

  return formatLabel(value);
};

const getCustomerName = (actor?: DeliveryActor | null) => {
  return actor?.username || actor?.fullName || actor?.email || 'N/A';
};

const getCustomerEmail = (actor?: DeliveryActor | null) => {
  return actor?.email || 'N/A';
};

const getItemCount = (orderItems?: DeliveryOrderItem[]) => {
  if (!Array.isArray(orderItems)) {
    return 0;
  }

  return orderItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
};

const getTotalAmount = (order?: DeliveryOrderRecord | null) => {
  const rawTotal = order?.totalPrice;
  const parsedTotal =
    typeof rawTotal === 'number'
      ? rawTotal
      : typeof rawTotal === 'string'
        ? Number.parseFloat(rawTotal)
        : Number.NaN;

  if (Number.isFinite(parsedTotal)) {
    return parsedTotal;
  }

  if (!Array.isArray(order?.orderItems)) {
    return 0;
  }

  return order.orderItems.reduce((sum, item) => {
    const price =
      typeof item.price === 'number'
        ? item.price
        : typeof item.price === 'string'
          ? Number.parseFloat(item.price)
          : 0;
    return sum + price * Number(item.quantity || 0);
  }, 0);
};

const formatShippingAddress = (shippingAddress?: Record<string, unknown> | null) => {
  if (!shippingAddress) {
    return 'N/A';
  }

  const parts = [
    shippingAddress['streetAddress'],
    shippingAddress['localAddress'],
    shippingAddress['town'],
    shippingAddress['city'],
    shippingAddress['district'],
    shippingAddress['state'],
    shippingAddress['province'],
    shippingAddress['country'],
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

const getInitials = (value?: string) => {
  const source = (value || '').trim();
  if (!source) {
    return 'R';
  }

  return source.charAt(0).toUpperCase();
};

export default function DeliveryPage() {
  const { token } = useAuth();
  const deliveryAPI = useMemo(() => createDeliveryAPI(token), [token]);

  const [activeTab, setActiveTab] = useState<DeliveryTab>('processing');
  const [processingOrders, setProcessingOrders] = useState<DeliveryOrderRecord[]>([]);
  const [warehouseOrders, setWarehouseOrders] = useState<DeliveryOrderRecord[]>([]);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [selectedProcessingOrder, setSelectedProcessingOrder] = useState<DeliveryOrderRecord | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);
  const [selectedRider, setSelectedRider] = useState<DeliveryRider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAssignmentDetailLoading, setIsAssignmentDetailLoading] = useState(false);
  const [isRiderDetailLoading, setIsRiderDetailLoading] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isCreateRiderOpen, setIsCreateRiderOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    orderId: '',
    riderId: '',
  });
  const [riderForm, setRiderForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [riderPasswordForm, setRiderPasswordForm] = useState({
    newPassword: '',
  });
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProcessingOrders = useCallback(async () => {
    if (!token) {
      setProcessingOrders([]);
      setError('Please log in to view delivery data.');
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const summaries = await deliveryAPI.getProcessingOrders();
      const details = await Promise.all(
        summaries.map(async (summary) => {
          try {
            const detail = await deliveryAPI.getProcessingOrderDetails(summary.id);
            const deliveryStatus = detail.deliveryStatus ?? summary.deliveryStatus;
            const status = detail.status ?? summary.status;

            return {
              ...detail,
              ...(deliveryStatus !== undefined ? { deliveryStatus } : {}),
              ...(status !== undefined ? { status } : {}),
            };
          } catch {
            return {
              id: summary.id,
              ...(summary.deliveryStatus !== undefined
                ? { deliveryStatus: summary.deliveryStatus }
                : {}),
              ...(summary.status !== undefined ? { status: summary.status } : {}),
              orderItems: [],
            } as DeliveryOrderRecord;
          }
        })
      );

      setProcessingOrders(
        details.sort((a, b) => {
          const left = new Date(b.createdAt || b.updatedAt || 0).getTime();
          const right = new Date(a.createdAt || a.updatedAt || 0).getTime();
          return left - right;
        })
      );
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load processing orders';
      setError(message);
      setProcessingOrders([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [deliveryAPI, token]);

  const loadWarehouseOrders = useCallback(async () => {
    if (!token) {
      setWarehouseOrders([]);
      setError('Please log in to view delivery data.');
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const payload = await deliveryAPI.getWarehouseOrderQueue(1, 20);
      setWarehouseOrders(payload.orders || []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load warehouse queue';
      setError(message);
      setWarehouseOrders([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [deliveryAPI, token]);

  const loadAssignments = useCallback(async () => {
    if (!token) {
      setAssignments([]);
      setError('Please log in to view delivery data.');
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const data = await deliveryAPI.getAssignments(1, 20);
      setAssignments(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load assignments';
      setError(message);
      setAssignments([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [deliveryAPI, token]);

  const loadRiders = useCallback(async () => {
    if (!token) {
      setRiders([]);
      setError('Please log in to view delivery data.');
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const data = await deliveryAPI.getRiders();
      setRiders(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load riders';
      setError(message);
      setRiders([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [deliveryAPI, token]);

  const refreshActiveTab = useCallback(async () => {
    switch (activeTab) {
      case 'processing':
        await loadProcessingOrders();
        break;
      case 'warehouse':
        await loadWarehouseOrders();
        break;
      case 'assignments':
      case 'recovery':
        await loadAssignments();
        break;
      case 'riders':
        await loadRiders();
        break;
      default:
        break;
    }
  }, [activeTab, loadAssignments, loadProcessingOrders, loadRiders, loadWarehouseOrders]);

  useEffect(() => {
    void refreshActiveTab();
  }, [refreshActiveTab]);

  useEffect(() => {
    setSelectedProcessingOrder(null);
    setSelectedAssignment(null);
    setSelectedRider(null);
    setIsDetailLoading(false);
    setIsAssignmentDetailLoading(false);
    setIsRiderDetailLoading(false);
    setIsCreateAssignmentOpen(false);
    setIsCreateRiderOpen(false);
    setRiderPasswordForm({ newPassword: '' });
  }, [activeTab]);

  const handleAssignmentFormChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setAssignmentForm((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleRiderFormChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const field = event.target.dataset['field'] || event.target.name;
      const { value } = event.target;
      setRiderForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    []
  );

  const handleRiderPasswordFormChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setRiderPasswordForm({ newPassword: value });
  }, []);

  const handleViewProcessingOrder = useCallback(async (orderId: number) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setIsDetailLoading(true);
    setError(null);

    try {
      const detail = await deliveryAPI.getProcessingOrderDetails(orderId);
      setSelectedProcessingOrder(detail);
    } catch (viewError) {
      const message = viewError instanceof Error ? viewError.message : 'Failed to load order details';
      toast.error(message);
    } finally {
      setIsDetailLoading(false);
    }
  }, [deliveryAPI, token]);

  const handleViewAssignment = useCallback(async (orderId: number) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setIsAssignmentDetailLoading(true);
    setIsCreateAssignmentOpen(false);
    setError(null);

    try {
      const detail = await deliveryAPI.getAssignmentDetails(orderId);
      setSelectedAssignment(detail);
    } catch (viewError) {
      const message = viewError instanceof Error ? viewError.message : 'Failed to load assignment details';
      toast.error(message);
    } finally {
      setIsAssignmentDetailLoading(false);
    }
  }, [deliveryAPI, token]);

  const handleViewRider = useCallback(async (riderId: number) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setIsRiderDetailLoading(true);
    setIsCreateRiderOpen(false);
    setError(null);

    try {
      const detail = await deliveryAPI.getRiderDetails(riderId);
      setSelectedRider(detail);
      setRiderPasswordForm({ newPassword: '' });
    } catch (viewError) {
      const message = viewError instanceof Error ? viewError.message : 'Failed to load rider details';
      toast.error(message);
    } finally {
      setIsRiderDetailLoading(false);
    }
  }, [deliveryAPI, token]);

  const handleOpenCreateAssignment = useCallback(async () => {
    setSelectedAssignment(null);
    setIsAssignmentDetailLoading(false);
    setIsCreateAssignmentOpen(true);

    if (riders.length === 0) {
      await loadRiders();
    }
  }, [loadRiders, riders.length]);

  const handleOpenCreateRider = useCallback(() => {
    setSelectedRider(null);
    setIsRiderDetailLoading(false);
    setIsCreateRiderOpen(true);
  }, []);

  const handleCreateAssignment = useCallback(async () => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    const orderId = Number.parseInt(assignmentForm.orderId, 10);
    const riderId = Number.parseInt(assignmentForm.riderId, 10);

    if (!Number.isFinite(orderId) || orderId <= 0) {
      toast.error('Enter a valid order ID');
      return;
    }

    if (!Number.isFinite(riderId) || riderId <= 0) {
      toast.error('Select a valid rider');
      return;
    }

    setActionKey('assignment-create');

    try {
      await deliveryAPI.createAssignment(orderId, riderId);
      toast.success('Assignment created successfully');
      setAssignmentForm({
        orderId: '',
        riderId: '',
      });
      setIsCreateAssignmentOpen(false);
      await loadAssignments();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Failed to create assignment';
      toast.error(message);
    } finally {
      setActionKey(null);
    }
  }, [assignmentForm.orderId, assignmentForm.riderId, deliveryAPI, loadAssignments, token]);

  const handleCreateRider = useCallback(async () => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    const fullName = riderForm.fullName.trim();
    const email = riderForm.email.trim();
    const phoneNumber = riderForm.phoneNumber.trim();
    const password = riderForm.password;

    if (!fullName) {
      toast.error('Enter the rider name');
      return;
    }

    if (!email) {
      toast.error('Enter the rider email');
      return;
    }

    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      toast.error('Phone number must be 10 digits');
      return;
    }

    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setActionKey('rider-create');

    try {
      await deliveryAPI.createRider({
        fullName,
        email,
        phoneNumber,
        password,
      });
      toast.success('Rider created successfully');
      setRiderForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
      });
      setIsCreateRiderOpen(false);
      await loadRiders();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Failed to create rider';
      toast.error(message);
    } finally {
      setActionKey(null);
    }
  }, [deliveryAPI, loadRiders, riderForm.email, riderForm.fullName, riderForm.password, riderForm.phoneNumber, token]);

  const handleResetRiderPassword = useCallback(async () => {
    if (!token || !selectedRider) {
      toast.error('Authentication required');
      return;
    }

    const newPassword = riderPasswordForm.newPassword.trim();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setActionKey(`rider-password-${selectedRider.id}`);

    try {
      await deliveryAPI.resetRiderPassword(selectedRider.id, newPassword);
      toast.success('Rider password updated successfully');
      setRiderPasswordForm({ newPassword: '' });
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Failed to reset rider password';
      toast.error(message);
    } finally {
      setActionKey(null);
    }
  }, [deliveryAPI, riderPasswordForm.newPassword, selectedRider, token]);

  const handleMoveToWarehouse = useCallback(async (orderId: number) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    const currentActionKey = `processing-${orderId}`;
    setActionKey(currentActionKey);

    try {
      await deliveryAPI.markOrderAtWarehouse(orderId);
      toast.success('Order moved to warehouse successfully');
      await loadProcessingOrders();
      setActiveTab('processing');
      setSelectedProcessingOrder(null);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Failed to move order to warehouse';
      toast.error(message);
    } finally {
      setActionKey(null);
    }
  }, [deliveryAPI, loadProcessingOrders, token]);

  const handleCollectItems = useCallback(async (order: DeliveryOrderRecord) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    const pendingItems = (order.orderItems || []).filter((item) => !item.collectedAtWarehouse);
    if (pendingItems.length === 0) {
      toast.success('All items are already collected');
      return;
    }

    const currentActionKey = `warehouse-collect-${order.id}`;
    setActionKey(currentActionKey);

    try {
      await Promise.all(pendingItems.map((item) => deliveryAPI.collectOrderItem(item.id)));
      toast.success('Order items collected successfully');
      await loadWarehouseOrders();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Failed to collect order items';
      toast.error(message);
    } finally {
      setActionKey(null);
    }
  }, [deliveryAPI, loadWarehouseOrders, token]);

  const handleWarehouseResetToWarehouse = useCallback(async (orderId: number) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    const currentActionKey = `warehouse-reset-${orderId}`;
    setActionKey(currentActionKey);

    try {
      await deliveryAPI.resetOrderToWarehouse(orderId);
      toast.success('Order reset to warehouse successfully');
      await loadWarehouseOrders();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Failed to reset order to warehouse';
      toast.error(message);
    } finally {
      setActionKey(null);
    }
  }, [deliveryAPI, loadWarehouseOrders, token]);

  const handleResetToWarehouse = useCallback(async (orderId: number) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    const currentActionKey = `recovery-${orderId}`;
    setActionKey(currentActionKey);

    try {
      await deliveryAPI.resetOrderToWarehouse(orderId);
      toast.success('Order reset to warehouse successfully');
      await loadAssignments();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Failed to reset order to warehouse';
      toast.error(message);
    } finally {
      setActionKey(null);
    }
  }, [deliveryAPI, loadAssignments, token]);

  const sectionTitle = useMemo(() => {
    const config = TAB_CONFIG.find((tab) => tab.key === activeTab);
    return config?.label || 'Processing Orders';
  }, [activeTab]);

  const recoveryAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => String(assignment.assignmentStatus || '').toUpperCase() === 'FAILED'
      ),
    [assignments]
  );

  const tableConfig = useMemo<DeliveryTableConfig>(() => {
    if (activeTab === 'processing') {
      return {
        columns: ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'],
        rows: processingOrders.map((order) => ({
          key: order.id,
          cells: [
            <span key="id" className="delivery-id">#{order.id}</span>,
            getCustomerName(order.orderedBy),
            `${getItemCount(order.orderItems)} item(s)`,
            formatCurrency(getTotalAmount(order)),
            <span key="status" className="delivery-status delivery-status--processing">
              {formatDeliveryStatusLabel(order.deliveryStatus || order.status || 'ORDER_PROCESSING')}
            </span>,
            formatDate(order.createdAt || order.updatedAt),
          ],
          action: {
            label: 'View Items',
            onClick: () => {
              void handleViewProcessingOrder(order.id);
            },
          },
        })),
        emptyMessage: error || 'No processing orders found.',
      };
    }

    if (activeTab === 'warehouse') {
      return {
        columns: ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'],
        rows: warehouseOrders.map((order) => {
          const pendingItems = (order.orderItems || []).filter((item) => !item.collectedAtWarehouse);
          const isCollecting = actionKey === `warehouse-collect-${order.id}`;
          const isResetting = actionKey === `warehouse-reset-${order.id}`;
          const isBusy = isCollecting || isResetting;

          return {
            key: order.id,
            cells: [
              <span key="id" className="delivery-id">#{order.id}</span>,
              getCustomerName(order.orderedBy),
              `${getItemCount(order.orderItems)} item(s)`,
              formatCurrency(getTotalAmount(order)),
              <span key="status" className="delivery-status delivery-status--processing">
                {formatDeliveryStatusLabel(order.deliveryStatus || 'READY_FOR_DELIVERY')}
              </span>,
              formatDate(order.updatedAt || order.createdAt),
            ],
            actions: [
              {
                label: isCollecting ? 'Working...' : pendingItems.length > 0 ? 'Collect Items' : 'Collected',
                onClick: () => {
                  void handleCollectItems(order);
                },
                disabled: isBusy || pendingItems.length === 0,
              },
              {
                label: isResetting ? 'Working...' : 'Reset To Warehouse',
                onClick: () => {
                  void handleWarehouseResetToWarehouse(order.id);
                },
                disabled: isBusy,
                variant: 'secondary',
              },
            ],
          };
        }),
        emptyMessage: error || 'No warehouse queue data found.',
      };
    }

    if (activeTab === 'assignments') {
      return {
        columns: ['Assignment ID', 'Order ID', 'Rider', 'Customer', 'Status', 'Date'],
        rows: assignments.map((assignment) => ({
          key: assignment.id,
          cells: [
            <span key="id" className="delivery-id">#{assignment.id}</span>,
            `#${assignment.orderId}`,
            assignment.rider?.fullName || assignment.rider?.username || 'Unassigned',
            getCustomerName(assignment.order?.orderedBy),
            formatLabel(assignment.assignmentStatus),
            formatDate(assignment.updatedAt || assignment.createdAt || assignment.order?.updatedAt),
          ],
          action: {
            label: 'View',
            onClick: () => {
              void handleViewAssignment(assignment.order?.id || assignment.orderId);
            },
          },
        })),
        emptyMessage: error || 'No assignments found.',
      };
    }

    if (activeTab === 'riders') {
      return {
        columns: ['Rider ID', 'Name', 'Email', 'Phone', 'Availability', 'Created'],
        rows: riders.map((rider) => ({
          key: rider.id,
          cells: [
            <span key="id" className="delivery-id">#{rider.id}</span>,
            rider.fullName || 'N/A',
            rider.email || 'N/A',
            rider.phoneNumber || 'N/A',
            rider.onDelivery ? 'On Delivery' : 'Available',
            formatDate(rider.createdAt),
          ],
        })),
        emptyMessage: error || 'No riders found.',
      };
    }

    return {
      columns: ['Assignment ID', 'Order ID', 'Customer', 'Reason', 'Status', 'Updated'],
      rows: recoveryAssignments.map((assignment) => ({
        key: assignment.id,
        cells: [
          <span key="id" className="delivery-id">#{assignment.id}</span>,
          `#${assignment.orderId}`,
          getCustomerName(assignment.order?.orderedBy),
          assignment.failureReason || 'Failed delivery',
          formatLabel(assignment.assignmentStatus || assignment.order?.deliveryStatus || 'FAILED'),
          formatDate(assignment.updatedAt || assignment.createdAt || assignment.order?.updatedAt),
        ],
        action: {
          label: actionKey === `recovery-${assignment.orderId}` ? 'Working...' : 'Reset Order',
          onClick: () => {
            void handleResetToWarehouse(assignment.orderId);
          },
          disabled: actionKey === `recovery-${assignment.orderId}`,
        },
      })),
      emptyMessage: error || 'No failed deliveries found.',
    };
  }, [
    activeTab,
    actionKey,
    assignments,
    error,
    handleCollectItems,
    handleWarehouseResetToWarehouse,
    handleResetToWarehouse,
    handleViewProcessingOrder,
    processingOrders,
    recoveryAssignments,
    riders,
    handleViewAssignment,
    warehouseOrders,
  ]);

  const showProcessingDetail = activeTab === 'processing' && (isDetailLoading || selectedProcessingOrder);
  const showAssignmentDetail =
    activeTab === 'assignments' && (isAssignmentDetailLoading || selectedAssignment);
  const showAssignmentCreateForm = activeTab === 'assignments' && isCreateAssignmentOpen;
  const showRiderDetail = activeTab === 'riders' && (isRiderDetailLoading || selectedRider);
  const showCreateRiderForm = activeTab === 'riders' && isCreateRiderOpen;
  const showWarehouseEmptyState =
    activeTab === 'warehouse' && !isRefreshing && tableConfig.rows.length === 0;
  const selectedAssignmentOrder = selectedAssignment?.order || null;
  const selectedAssignmentRiderName =
    selectedAssignment?.rider?.fullName || selectedAssignment?.rider?.username || 'Unassigned';
  const selectedRiderLinkedUserId =
    selectedRider?.linkedUserId ?? selectedRider?.userId ?? 'N/A';
  const riderTitle = `Riders (${riders.length})`;
  const ridersListContent =
    riders.length > 0 ? (
      <div className="delivery-riders-grid">
        {riders.map((rider) => (
          <button
            key={rider.id}
            type="button"
            className="delivery-rider-card"
            onClick={() => {
              void handleViewRider(rider.id);
            }}
          >
            <span className="delivery-rider-avatar">
              {getInitials(rider.fullName || rider.email)}
            </span>
            <span className="delivery-rider-name">{rider.fullName || 'Unnamed Rider'}</span>
            <span className="delivery-rider-phone">
              <FiPhoneCall />
              <span>{rider.phoneNumber || 'N/A'}</span>
            </span>
            <span className="delivery-rider-meta">ID #{rider.id} - Click to view</span>
          </button>
        ))}
      </div>
    ) : (
      <div className="delivery-empty-state delivery-empty-state--riders">
        <span className="delivery-empty-state__icon" aria-hidden="true">🛵</span>
        <p className="delivery-empty-state__text">No riders found.</p>
      </div>
    );

  return (
    <div className="delivery-page">
      <div className="delivery-tabs-wrap">
        <div className="delivery-tabs" role="tablist" aria-label="Delivery sections">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`delivery-tab delivery-tab--${tab.key} ${
                activeTab === tab.key ? 'delivery-tab--active' : ''
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className={`delivery-tab__icon delivery-tab__icon--${tab.key}`}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <span className="delivery-tabs__control" aria-hidden="true">
          <span className="delivery-tabs__control-arrow delivery-tabs__control-arrow--up" />
          <span className="delivery-tabs__control-line" />
          <span className="delivery-tabs__control-arrow delivery-tabs__control-arrow--down" />
        </span>
      </div>

      <section className="delivery-section" aria-label="Delivery data table">
        {showProcessingDetail ? (
          <div className="delivery-detail-card">
            <button
              type="button"
              className="delivery-back-btn"
              onClick={() => setSelectedProcessingOrder(null)}
            >
              ← Back to list
            </button>

            {isDetailLoading ? (
              <div className="delivery-empty">Loading order details...</div>
            ) : selectedProcessingOrder ? (
              <>
                <div className="delivery-detail-card__header">
                  <h2 className="delivery-detail-card__title">Order #{selectedProcessingOrder.id}</h2>
                  <div className="delivery-detail-card__actions">
                    <span className="delivery-status delivery-status--processing">
                      {formatDeliveryStatusLabel(
                        selectedProcessingOrder.deliveryStatus ||
                          selectedProcessingOrder.status ||
                          'ORDER_PROCESSING'
                      )}
                    </span>
                    <button
                      type="button"
                      className="delivery-view-btn delivery-view-btn--warehouse"
                      onClick={() => {
                        void handleMoveToWarehouse(selectedProcessingOrder.id);
                      }}
                      disabled={actionKey === `processing-${selectedProcessingOrder.id}`}
                    >
                      <span className="delivery-view-btn__icon" aria-hidden="true">🏬</span>
                      {actionKey === `processing-${selectedProcessingOrder.id}`
                        ? 'Working...'
                        : 'Mark At Warehouse'}
                    </button>
                  </div>
                </div>

                <div className="delivery-detail-grid">
                  <div className="delivery-detail-field">
                    <span className="delivery-detail-field__label">Customer</span>
                    <span className="delivery-detail-field__value">
                      {getCustomerName(selectedProcessingOrder.orderedBy)}
                    </span>
                  </div>
                  <div className="delivery-detail-field">
                    <span className="delivery-detail-field__label">Email</span>
                    <span className="delivery-detail-field__value">
                      {getCustomerEmail(selectedProcessingOrder.orderedBy)}
                    </span>
                  </div>
                  <div className="delivery-detail-field">
                    <span className="delivery-detail-field__label">Shipping Address</span>
                    <span className="delivery-detail-field__value">
                      {formatShippingAddress(selectedProcessingOrder.shippingAddress)}
                    </span>
                  </div>
                  <div className="delivery-detail-field">
                    <span className="delivery-detail-field__label">Total</span>
                    <span className="delivery-detail-field__value">
                      {formatCurrency(getTotalAmount(selectedProcessingOrder))}
                    </span>
                  </div>
                </div>

                <div className="delivery-detail-items">
                  <h3 className="delivery-detail-items__title">Order Items</h3>
                  {selectedProcessingOrder.orderItems && selectedProcessingOrder.orderItems.length > 0 ? (
                    <div className="delivery-detail-items__list">
                      {selectedProcessingOrder.orderItems.map((item) => (
                        <div key={item.id} className="delivery-detail-item">
                          <div className="delivery-detail-item__main">
                            <span className="delivery-detail-item__name">
                              {item.product?.name || `Item #${item.id}`}
                            </span>
                            <span className="delivery-detail-item__meta">
                              Qty: {Number(item.quantity || 0)} • {formatCurrency(item.price)}
                            </span>
                          </div>
                          <span className="delivery-detail-item__vendor">
                            {item.vendor?.businessName || item.vendor?.name || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="delivery-detail-items__empty">No items found.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <>
            {!showAssignmentDetail &&
            !showAssignmentCreateForm &&
            !showRiderDetail &&
            !showCreateRiderForm &&
            activeTab !== 'riders' ? (
              <div className="delivery-section__header">
                <h2 className="delivery-section__title">{sectionTitle}</h2>
                <div className="delivery-section__actions">
                  {activeTab === 'assignments' ? (
                    <button
                      type="button"
                      className="delivery-view-btn delivery-view-btn--create"
                      onClick={() => {
                        void handleOpenCreateAssignment();
                      }}
                      disabled={isRefreshing}
                    >
                      + Create Assignment
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="delivery-refresh-btn"
                    onClick={() => {
                      void refreshActiveTab();
                    }}
                    disabled={isRefreshing}
                  >
                    <FiRefreshCw className={isRefreshing ? 'delivery-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            ) : null}

            {showAssignmentCreateForm ? (
              <div className="delivery-detail-card">
                <button
                  type="button"
                  className="delivery-back-btn"
                  onClick={() => setIsCreateAssignmentOpen(false)}
                >
                  ← Back to list
                </button>

                <div className="delivery-detail-card__header">
                  <h2 className="delivery-detail-card__title">Create Assignment</h2>
                </div>

                <div className="delivery-form-grid">
                  <label className="delivery-form-field">
                    <span className="delivery-detail-field__label">Order ID</span>
                    <input
                      type="number"
                      name="orderId"
                      className="delivery-form-control"
                      value={assignmentForm.orderId}
                      onChange={handleAssignmentFormChange}
                      placeholder="Enter order ID"
                      min="1"
                    />
                  </label>

                  <label className="delivery-form-field">
                    <span className="delivery-detail-field__label">Rider</span>
                    {riders.length > 0 ? (
                      <select
                        name="riderId"
                        className="delivery-form-control"
                        value={assignmentForm.riderId}
                        onChange={handleAssignmentFormChange}
                      >
                        <option value="">Select rider</option>
                        {riders.map((rider) => (
                          <option key={rider.id} value={rider.id}>
                            #{rider.id} {rider.fullName || rider.email || rider.phoneNumber || 'Rider'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        name="riderId"
                        className="delivery-form-control"
                        value={assignmentForm.riderId}
                        onChange={handleAssignmentFormChange}
                        placeholder={isRefreshing ? 'Loading riders...' : 'Enter rider ID'}
                        min="1"
                      />
                    )}
                  </label>
                </div>

                <div className="delivery-form-actions">
                  <button
                    type="button"
                    className="delivery-view-btn delivery-view-btn--secondary"
                    onClick={() => setIsCreateAssignmentOpen(false)}
                    disabled={actionKey === 'assignment-create'}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="delivery-view-btn"
                    onClick={() => {
                      void handleCreateAssignment();
                    }}
                    disabled={actionKey === 'assignment-create'}
                  >
                    {actionKey === 'assignment-create' ? 'Creating...' : 'Create Assignment'}
                  </button>
                </div>
              </div>
            ) : showAssignmentDetail ? (
              <div className="delivery-detail-card">
                <button
                  type="button"
                  className="delivery-back-btn"
                  onClick={() => setSelectedAssignment(null)}
                >
                  ← Back to list
                </button>

                {isAssignmentDetailLoading ? (
                  <div className="delivery-empty">Loading assignment details...</div>
                ) : selectedAssignment ? (
                  <>
                    <div className="delivery-detail-card__header">
                      <h2 className="delivery-detail-card__title">Assignment #{selectedAssignment.id}</h2>
                      <div className="delivery-detail-card__actions">
                        <span className="delivery-status delivery-status--assignment">
                          {formatLabel(selectedAssignment.assignmentStatus || 'ASSIGNED')}
                        </span>
                      </div>
                    </div>

                    <div className="delivery-detail-grid">
                      <div className="delivery-detail-field">
                        <span className="delivery-detail-field__label">Order ID</span>
                        <span className="delivery-detail-field__value">#{selectedAssignment.orderId}</span>
                      </div>
                      <div className="delivery-detail-field">
                        <span className="delivery-detail-field__label">Rider</span>
                        <span className="delivery-detail-field__value">{selectedAssignmentRiderName}</span>
                      </div>
                      <div className="delivery-detail-field">
                        <span className="delivery-detail-field__label">Customer</span>
                        <span className="delivery-detail-field__value">
                          {getCustomerName(selectedAssignmentOrder?.orderedBy)}
                        </span>
                      </div>
                      <div className="delivery-detail-field">
                        <span className="delivery-detail-field__label">Email</span>
                        <span className="delivery-detail-field__value">
                          {getCustomerEmail(selectedAssignmentOrder?.orderedBy)}
                        </span>
                      </div>
                      <div className="delivery-detail-field">
                        <span className="delivery-detail-field__label">Shipping Address</span>
                        <span className="delivery-detail-field__value">
                          {formatShippingAddress(selectedAssignmentOrder?.shippingAddress)}
                        </span>
                      </div>
                      <div className="delivery-detail-field">
                        <span className="delivery-detail-field__label">Total</span>
                        <span className="delivery-detail-field__value">
                          {formatCurrency(getTotalAmount(selectedAssignmentOrder))}
                        </span>
                      </div>
                    </div>

                    <div className="delivery-detail-items">
                      <h3 className="delivery-detail-items__title">Order Items</h3>
                      {selectedAssignmentOrder?.orderItems && selectedAssignmentOrder.orderItems.length > 0 ? (
                        <div className="delivery-detail-items__list">
                          {selectedAssignmentOrder.orderItems.map((item) => (
                            <div key={item.id} className="delivery-detail-item">
                              <div className="delivery-detail-item__main">
                                <span className="delivery-detail-item__name">
                                  {item.product?.name || `Item #${item.id}`}
                                </span>
                                <span className="delivery-detail-item__meta">
                                  Qty: {Number(item.quantity || 0)} • {formatCurrency(item.price)}
                                </span>
                              </div>
                              <span className="delivery-detail-item__vendor">
                                {item.vendor?.businessName || item.vendor?.name || 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="delivery-detail-items__empty">No items found.</p>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            ) : showCreateRiderForm ? (
              <div className="delivery-riders-shell">
                <div className="delivery-riders-header">
                  <h2 className="delivery-riders-title">{riderTitle}</h2>
                  <button
                    type="button"
                    className="delivery-view-btn delivery-view-btn--create delivery-rider-create-btn delivery-rider-create-btn--cancel"
                    onClick={() => setIsCreateRiderOpen(false)}
                    disabled={actionKey === 'rider-create'}
                  >
                    × Cancel
                  </button>
                </div>

                <div className="delivery-rider-create-panel">
                  <h3 className="delivery-rider-create-panel__title">New Rider</h3>

                  <form
                    className="delivery-rider-create-form"
                    autoComplete="off"
                    onSubmit={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <label className="delivery-rider-create-field">
                      <span className="delivery-rider-create-field__label">Full Name *</span>
                      <input
                        type="text"
                        name="delivery-rider-full-name"
                        data-field="fullName"
                        className="delivery-rider-create-input"
                        value={riderForm.fullName}
                        onChange={handleRiderFormChange}
                        autoComplete="off"
                        placeholder="e.g. Ram Bahadur"
                      />
                    </label>

                    <label className="delivery-rider-create-field">
                      <span className="delivery-rider-create-field__label">Phone Number *</span>
                      <input
                        type="text"
                        name="delivery-rider-phone-number"
                        data-field="phoneNumber"
                        className="delivery-rider-create-input"
                        value={riderForm.phoneNumber}
                        onChange={handleRiderFormChange}
                        autoComplete="off"
                        placeholder="e.g. 98XXXXXXXX"
                        inputMode="numeric"
                      />
                    </label>

                    <label className="delivery-rider-create-field">
                      <span className="delivery-rider-create-field__label">Email *</span>
                      <input
                        type="email"
                        name="delivery-rider-email"
                        data-field="email"
                        className="delivery-rider-create-input"
                        value={riderForm.email}
                        onChange={handleRiderFormChange}
                        autoComplete="off"
                        placeholder="e.g. rider@example.com"
                      />
                    </label>

                    <label className="delivery-rider-create-field">
                      <span className="delivery-rider-create-field__label">Password *</span>
                      <input
                        type="password"
                        name="delivery-rider-password"
                        data-field="password"
                        className="delivery-rider-create-input"
                        value={riderForm.password}
                        onChange={handleRiderFormChange}
                        autoComplete="new-password"
                        placeholder="Enter password"
                      />
                    </label>
                  </form>

                  <div className="delivery-rider-create-actions">
                    <button
                      type="button"
                      className="delivery-rider-create-submit"
                      onClick={() => {
                        void handleCreateRider();
                      }}
                      disabled={actionKey === 'rider-create'}
                    >
                      {actionKey === 'rider-create' ? 'Creating...' : '✓ Create Rider'}
                    </button>

                    <button
                      type="button"
                      className="delivery-rider-create-inline-cancel"
                      onClick={() => setIsCreateRiderOpen(false)}
                      disabled={actionKey === 'rider-create'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {ridersListContent}
              </div>
            ) : showRiderDetail ? (
              <div className="delivery-detail-card delivery-rider-profile-card">
                <button
                  type="button"
                  className="delivery-back-btn"
                  onClick={() => setSelectedRider(null)}
                >
                  ← Back to riders
                </button>

                {isRiderDetailLoading ? (
                  <div className="delivery-empty">Loading rider details...</div>
                ) : selectedRider ? (
                  <>
                    <h2 className="delivery-rider-profile-title">Rider Profile</h2>

                    <div className="delivery-rider-profile-head">
                      <span className="delivery-rider-avatar delivery-rider-avatar--detail">
                        {getInitials(selectedRider.fullName || selectedRider.email)}
                      </span>
                      <div className="delivery-rider-profile-head__content">
                        <h3 className="delivery-rider-profile-head__name">
                          {selectedRider.fullName || `Rider #${selectedRider.id}`}
                        </h3>
                        <p className="delivery-rider-profile-head__phone">
                          {selectedRider.phoneNumber || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="delivery-rider-profile-grid">
                      <div className="delivery-rider-profile-column">
                        <div className="delivery-rider-profile-field">
                          <span className="delivery-rider-profile-field__label">Rider ID</span>
                          <span className="delivery-rider-profile-field__value">#{selectedRider.id}</span>
                        </div>
                        <div className="delivery-rider-profile-field">
                          <span className="delivery-rider-profile-field__label">Created</span>
                          <span className="delivery-rider-profile-field__value">
                            {formatDate(selectedRider.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="delivery-rider-profile-column">
                        <div className="delivery-rider-profile-field">
                          <span className="delivery-rider-profile-field__label">Linked User ID</span>
                          <span className="delivery-rider-profile-field__value">
                            {selectedRiderLinkedUserId === 'N/A'
                              ? 'N/A'
                              : `#${selectedRiderLinkedUserId}`}
                          </span>
                        </div>

                        <div className="delivery-rider-profile-field delivery-rider-profile-field--password">
                          <span className="delivery-rider-profile-password__label">
                            Reset Rider Password
                          </span>
                          <div className="delivery-rider-profile-password__row">
                            <input
                              type="password"
                              className="delivery-rider-profile-password__input"
                              value={riderPasswordForm.newPassword}
                              onChange={handleRiderPasswordFormChange}
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              className="delivery-rider-profile-password__button"
                              onClick={() => {
                                void handleResetRiderPassword();
                              }}
                              disabled={actionKey === `rider-password-${selectedRider.id}`}
                            >
                              {actionKey === `rider-password-${selectedRider.id}` ? 'Changing...' : 'Change'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            ) : activeTab === 'riders' ? (
              <div className="delivery-riders-shell">
                <div className="delivery-riders-header">
                  <h2 className="delivery-riders-title">{riderTitle}</h2>
                  <button
                    type="button"
                    className="delivery-view-btn delivery-view-btn--create delivery-rider-create-btn"
                    onClick={handleOpenCreateRider}
                  >
                    + New Rider
                  </button>
                </div>
                {ridersListContent}
              </div>
            ) : showWarehouseEmptyState ? (
              <div className="delivery-empty-state">
                <span className="delivery-empty-state__icon" aria-hidden="true">📦</span>
                <p className="delivery-empty-state__text">No orders in the warehouse queue</p>
              </div>
            ) : (
              <div className="delivery-table-wrap">
                <table className="delivery-table">
                  <thead>
                    <tr>
                      {tableConfig.columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableConfig.rows.length > 0 ? (
                      tableConfig.rows.map((row) => (
                        <tr key={row.key}>
                          {row.cells.map((cell, index) => (
                            <td key={`${row.key}-${index}`}>{cell}</td>
                          ))}
                          <td>
                            {row.actions && row.actions.length > 0 ? (
                              <div className="delivery-table-actions">
                                {row.actions.map((action, index) => (
                                  <button
                                    key={`${row.key}-action-${index}`}
                                    type="button"
                                    className={`delivery-view-btn ${
                                      action.variant === 'secondary' ? 'delivery-view-btn--secondary' : ''
                                    }`}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            ) : row.action ? (
                              <button
                                type="button"
                                className={`delivery-view-btn ${
                                  row.action.variant === 'secondary' ? 'delivery-view-btn--secondary' : ''
                                }`}
                                onClick={row.action.onClick}
                                disabled={row.action.disabled}
                              >
                                {row.action.label}
                              </button>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="delivery-empty" colSpan={tableConfig.columns.length + 1}>
                          {isRefreshing ? 'Loading delivery data...' : tableConfig.emptyMessage}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
