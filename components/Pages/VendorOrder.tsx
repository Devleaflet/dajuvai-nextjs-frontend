'use client';

import React, { useState, useEffect, useCallback } from "react";
import Pagination from "@/components/Components/Pagination";
import OrderList from "@/components/Components/OrderList";
import ViewModal from "@/components/Components/Modal/ViewModal";
import { useDocketHeight } from "@/lib/hooks/UseDockerHeight";
import "@/styles/VendorOrder.css";
import * as XLSX from "xlsx";
import VendorDashboardService from "@/lib/services/vendorDashboardService";
import { useVendorAuth } from "@/lib/context/VendorAuthContext";
import { Order, OrderDetail } from "@/components/Components/Types/Order";
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from "next/navigation";

interface VendorOrderApiOrderedBy {
  id: number;
  name?: string;
  username?: string;
  email?: string;
}

interface VendorOrderApiShippingAddress {
  province?: string;
  city?: string;
  district?: string;
  streetAddress?: string;
  localAddress?: string;
}

interface VendorOrderApiItem {
  id?: number;
  productId: number;
  quantity: number;
  price: number | string;
  product?: {
    name?: string;
  };
  vendor?: {
    id: number;
    name?: string;
    businessName?: string;
  };
}

interface VendorOrderApiOrder {
  id: number;
  orderedBy: VendorOrderApiOrderedBy;
  shippingAddress?: VendorOrderApiShippingAddress;
  orderItems: VendorOrderApiItem[];
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
  totalPrice?: number | string;
  shippingFee?: number | string;
}

interface VendorOrdersApiResponse {
  success: boolean;
  data: VendorOrderApiOrder[];
}

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeOrderStatus = (status?: string): string => {
  if (!status) return "pending";
  const normalized = status.toLowerCase();
  if (["delivered", "pending", "canceled"].includes(normalized)) {
    return normalized;
  }
  return normalized || "pending";
};

const getCustomerName = (orderedBy?: VendorOrderApiOrderedBy): string => {
  if (!orderedBy) return "Unknown Customer";
  return orderedBy.name || orderedBy.username || "Unknown Customer";
};

const getOrderTotal = (order: VendorOrderApiOrder): number => {
  const subtotalFromItems = (order.orderItems || []).reduce((sum, item) => {
    return sum + toNumber(item.price) * item.quantity;
  }, 0);

  const totalPrice = toNumber(order.totalPrice);
  const shippingFee = toNumber(order.shippingFee);
  return totalPrice > 0 ? totalPrice + shippingFee : subtotalFromItems;
};

const mapApiOrderToTableOrder = (order: VendorOrderApiOrder): Order => {
  const firstItem = order.orderItems?.[0];
  return {
    id: order.id,
    orderId: `#ORD${String(order.id).padStart(4, "0")}`,
    orderedBy: getCustomerName(order.orderedBy),
    product: firstItem?.product?.name || "Unknown Product",
    createdAt: order.createdAt || new Date().toISOString(),
    price: getOrderTotal(order),
    paymentStatus: order.paymentMethod || "Unknown",
    status: normalizeOrderStatus(order.status),
  };
};

const mapApiOrderToOrderDetail = (order: VendorOrderApiOrder): OrderDetail => {
  const shippingAddress = order.shippingAddress || {};
  return {
    id: order.id,
    orderedBy: {
      id: order.orderedBy?.id || 0,
      username: getCustomerName(order.orderedBy),
      email: order.orderedBy?.email || "N/A",
    },
    shippingAddress: {
      province: shippingAddress.province || "N/A",
      district: shippingAddress.district || "N/A",
      city: shippingAddress.city || "N/A",
      localAddress: shippingAddress.streetAddress || shippingAddress.localAddress || "",
    },
    orderItems: (order.orderItems || []).map((item, index) => ({
      id: item.id || index + 1,
      productId: item.productId,
      quantity: item.quantity,
      price: String(toNumber(item.price)),
      product: {
        name: item.product?.name || "Unknown Product",
      },
      vendor: {
        id: item.vendor?.id || 0,
        businessName: item.vendor?.businessName || item.vendor?.name || "Unknown Vendor",
      },
    })),
    totalPrice: String(toNumber(order.totalPrice) || getOrderTotal(order)),
    shippingFee: String(toNumber(order.shippingFee)),
    paymentMethod: order.paymentMethod || "Unknown",
    status: normalizeOrderStatus(order.status),
    createdAt: order.createdAt || new Date().toISOString(),
  };
};

const VendorOrder: React.FC = () => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("All Orders");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [searchQuery] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const docketHeight = useDocketHeight();
  const { authState } = useVendorAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(5);

  // Sorting state
  const [sortOption, setSortOption] = useState<string>("newest");

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null);

  // TanStack Query for orders
  const {
    data: allOrders = [] as Order[],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["vendor-orders", authState.token],
    queryFn: async () => {
      if (!authState.token) throw new Error("No authentication token available");
      const dashboardService = VendorDashboardService.getInstance();
      const response = (await dashboardService.getVendorOrdersNew(authState.token)) as VendorOrdersApiResponse;
      const apiOrders = Array.isArray(response?.data) ? response.data : [];
      return apiOrders.map(mapApiOrderToTableOrder);
    },
    enabled: !!authState.token
  });

  const orderIdFromParams = searchParams.get('orderId');

  // Fetch order details for viewing
  const fetchOrderDetails = useCallback(async (orderId: number) => {
    if (!authState.token) return;
    try {
      const dashboardService = VendorDashboardService.getInstance();
      const response = await dashboardService.getVendorOrderDetail(authState.token, orderId);
      const rawOrder = (response?.data || response) as VendorOrderApiOrder;
      if (!rawOrder || !Array.isArray(rawOrder.orderItems)) {
        throw new Error("Order detail format is invalid");
      }
      setSelectedOrderDetail(mapApiOrderToOrderDetail(rawOrder));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch order details";
      setErrorMessage(message);
    }
  }, [authState.token]);

  useEffect(() => {
    if (orderIdFromParams && allOrders.length > 0) {
      const order = allOrders.find((o: Order) => o.id.toString() === orderIdFromParams);
      if (order) {
        setSelectedOrder(order);
        fetchOrderDetails(order.id);
        setIsViewModalOpen(true);
      }
    }
  }, [orderIdFromParams, allOrders, fetchOrderDetails]);

  // Filtering
  let filteredOrders = [...allOrders];
  switch (activeTab) {
    case "Completed":
      filteredOrders = filteredOrders.filter((o: Order) => o.status === "delivered");
      break;
    case "Pending":
      filteredOrders = filteredOrders.filter((o: Order) => o.status === "pending");
      break;
    case "Canceled":
      filteredOrders = filteredOrders.filter((o: Order) => o.status === "canceled");
      break;
    default:
      break;
  }
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter(
      (order: Order) =>
        order.product.toLowerCase().includes(query) ||
        order.orderedBy.toLowerCase().includes(query)
    );
  }
  // Sorting
  switch (sortOption) {
    case "newest":
      filteredOrders.sort(
        (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "oldest":
      filteredOrders.sort(
        (a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      break;
    case "highestPrice":
      filteredOrders.sort((a: Order, b: Order) => b.price - a.price);
      break;
    case "lowestPrice":
      filteredOrders.sort((a: Order, b: Order) => a.price - b.price);
      break;
    default:
      break;
  }
  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const displayedOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabs = [
    { id: "All Orders", label: `All Orders (${allOrders.length})` },
    {
      id: "Completed",
      label: `Completed (${allOrders.filter((o: Order) => o.status === "delivered").length})`,
    },
    {
      id: "Pending",
      label: `Pending (${allOrders.filter((o: Order) => o.status === "pending").length})`,
    },
    {
      id: "Canceled",
      label: `Canceled (${allOrders.filter((o: Order) => o.status === "canceled").length})`,
    },
  ];

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Export to CSV
  const handleExportCSV = () => {
    const csvData = filteredOrders.map((order: Order) => ({
      "Order ID": order.orderId,
      "Ordered By": order.orderedBy,
      Product: order.product,
      "Created At": order.createdAt,
      Price: order.price,
      "Payment Status": order.paymentStatus,
      Status: order.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders.csv");
  };

  // Export to Excel
  const handleExportExcel = () => {
    const excelData = filteredOrders.map((order: Order) => ({
      "Order ID": order.orderId,
      "Ordered By": order.orderedBy,
      Product: order.product,
      "Created At": order.createdAt,
      Price: order.price,
      "Payment Status": order.paymentStatus,
      Status: order.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders.xlsx");
  };

  // Modal handler for viewing
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.id);
    setIsViewModalOpen(true);
  };

  if (loading) {
    return (
      <main
        className="dashboard__main"
        style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}
      >
        <div className="vendor-order__tabs">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton" style={{ width: "100px", height: "24px", margin: "0 8px" }}></div>
          ))}
        </div>
        <div className="vendor-order__sorting">
          <div className="skeleton" style={{ width: "80px", height: "16px" }}></div>
          <div className="skeleton" style={{ width: "120px", height: "24px" }}></div>
        </div>
        <div className="vendor-order__export-buttons">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="skeleton" style={{ width: "100px", height: "24px", margin: "0 8px" }}></div>
          ))}
        </div>
        <div className="vendor-order__order-list-skeleton">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="skeleton" style={{ width: "100%", height: "60px", marginBottom: "8px" }}></div>
          ))}
        </div>
      </main>
    );
  }

  if (error) return <div className="vendor-order__error">{error.message}</div>;
  if (errorMessage) return <div className="vendor-order__error">{errorMessage}</div>;

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <style>{`
        .order-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 0 16px 0;
          background: #fff;
        }
        .order-header img {
          width: 120px;
          height: auto;
          margin-bottom: 0;
        }
        @media (max-width: 600px) {
          .order-header {
            padding: 18px 0 8px 0;
          }
          .order-header img {
            width: 90px;
          }
        }
        .vendor-order__table-container {
          overflow-x: auto;
          background: #fff;
        }
        .vendor-order__table {
          min-width: 700px;
        }
      `}</style>

      <main
        className="dashboard__main"
        style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}
      >
            <div className="vendor-order__tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`vendor-order__tab ${activeTab === tab.id ? "vendor-order__tab--active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="vendor-order__sorting">
              <label htmlFor="sort-options">Sort By:</label>
              <select
                id="sort-options"
                className="vendor-order__sort-dropdown"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestPrice">Highest Price</option>
                <option value="lowestPrice">Lowest Price</option>
              </select>
            </div>
            <div className="vendor-order__export-buttons">
              <button onClick={handleExportCSV}>Export to CSV</button>
              <button onClick={handleExportExcel}>Export to Excel</button>
            </div>
            {displayedOrders.length > 0 ? (
              <>
                <OrderList
                  orders={displayedOrders}
                  isMobile={isMobile}
                  onView={handleViewOrder}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="vendor-order__no-results">
                No orders found. {searchQuery && "Try a different search query."}
              </div>
            )}
      </main>
        <ViewModal
          show={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        order={selectedOrder}
          orderDetail={selectedOrderDetail}
        />
    </div>
  );
};

export default VendorOrder;
