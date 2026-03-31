'use client';

import type { Chart as ChartJS } from 'chart.js';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import axiosInstance from "@/lib/api/axiosInstance";
import Skeleton from "@/components/Components/Skeleton/Skeleton";
import { useAuth } from "@/lib/context/AuthContext";
import "@/styles/AdminDashboard.css";
import { useDocketHeight } from '@/lib/hooks/UseDockerHeight';

const RevenueByCategory = dynamic(() => import("@/components/Components/AdminDashboard/CategoryRevenue"), {
	loading: () => <Skeleton type="text" />,
	ssr: false
});

const RevenueBySubCategory = dynamic(() => import("@/components/Components/AdminDashboard/SubCategoryRevenue"), {
	loading: () => <Skeleton type="text" />,
	ssr: false
});

const RevenueByVendor = dynamic(() => import("@/components/Components/AdminDashboard/VendorRevenue"), {
	loading: () => <Skeleton type="text" />,
	ssr: false
});

const STATS_CACHE_KEY = 'admin_dashboard_stats';
const REVENUE_CACHE_KEY = 'admin_dashboard_revenue';
const GROSS_REVENUE_TREND_CACHE_KEY = 'admin_dashboard_gross_revenue_trend';
const ACTION_METRICS_CACHE_KEY = 'admin_dashboard_action_metrics';
const USER_STATS_CACHE_KEY = 'admin_dashboard_user_stats';
const USER_HEAT_CACHE_KEY = 'admin_dashboard_user_heat';
const VENDORS_CACHE_KEY = 'admin_dashboard_vendors_sales';
const TOP_PRODUCTS_CACHE_KEY = 'admin_dashboard_top_products';
const CACHE_TTL = 5 * 60 * 1000;

let chartModulePromise: Promise<typeof import('chart.js/auto')> | null = null;

const loadChartModule = () => {
	if (!chartModulePromise) {
		chartModulePromise = import('chart.js/auto');
	}
	return chartModulePromise;
};

interface StatData {
	totalSales: number;
	totalOrders: number;
	totalCustomers: number;
	totalVendors: number;
	totalProducts: number;
	totalDeliveredRevenue: number;
	totalShippingRevenue: number;
}

interface RevenueData {
	date: string;
	revenue: string;
}

interface UserStatsSummary {
	totalUsers: number;
	activeUsers: number;
	newUsers: number;
}

interface UserHeatPoint {
	label: string;
	value: number;
}

interface VendorSales {
	vendorId: number;
	businessName: string;
	totalSales: number;
}

interface TopProduct {
	productId: number;
	productName: string;
	totalSales: number;
}

interface ActionOrder {
	createdAt?: string;
	status?: string;
}

interface PaginatedData<T> {
	success: boolean;
	currentPage: number;
	totalPage: number;
	totalData: number;
	data: T[];
}

interface StatsCardProps {
	title: string;
	value: string | number;
	iconType: string;
	change: number;
	trend: 'up' | 'down';
	timeframe: string;
}

function StatsCard({ title, value, iconType }: StatsCardProps) {
	return (
		<div className="stat-card">
			<div className="stat-icon">
				{iconType === 'sales' && '💰'}
				{iconType === 'orders' && '📦'}
				{iconType === 'customers' && '👥'}
				{iconType === 'vendors' && '🏪'}
				{iconType === 'products' && '📱'}
			</div>
			<div className="stat-content">
				<h3 className="stat-title">{title}</h3>
				<p className="stat-value">{value}</p>
			</div>
		</div>
	);
}

export function AdminDashboard() {
	const { token } = useAuth();
	const [isMobile, setIsMobile] = useState(false);
	const [stats, setStats] = useState<StatData | null>(null);
	const [revenue, setRevenue] = useState<RevenueData[]>([]);
	const [vendorsSales, setVendorsSales] = useState<VendorSales[]>([]);
	const [vendorsPaginated, setVendorsPaginated] =
		useState<PaginatedData<VendorSales> | null>(null);
	const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
	const [topProductsPaginated, setTopProductsPaginated] =
		useState<PaginatedData<TopProduct> | null>(null);
	const [todaysSales, setTodaysSales] = useState(0);
	const [todaysSalesData, setTodaysSalesData] = useState<
		{ label: string; value: number }[]
	>([]);
	const [days, setDays] = useState<number>(15);
	const [vendorsStartDate, setVendorsStartDate] = useState<string>('');
	const [vendorsEndDate, setVendorsEndDate] = useState<string>('');
	const [topProductsStartDate, setTopProductsStartDate] = useState<string>('');
	const [topProductsEndDate, setTopProductsEndDate] = useState<string>('');
	const [vendorsPage, setVendorsPage] = useState<number>(1);
	const [topProductsPage, setTopProductsPage] = useState<number>(1);
	const [statsLoading, setStatsLoading] = useState(true);
	const [revenueLoading, setRevenueLoading] = useState(true);
	const [grossRevenueLoading, setGrossRevenueLoading] = useState(true);
	const [vendorsLoading, setVendorsLoading] = useState(true);
	const [topProductsLoading, setTopProductsLoading] = useState(true);
	const [todaysLoading, setTodaysLoading] = useState(true);
	const [grossRevenue, setGrossRevenue] = useState(0);
	const [grossRevenueTrendText, setGrossRevenueTrendText] = useState('+0% vs last month');
	const [ordersToday, setOrdersToday] = useState(0);
	const [pendingApprovals, setPendingApprovals] = useState(0);
	const [delayedOrders, setDelayedOrders] = useState(0);
	const [userStatsSummary, setUserStatsSummary] = useState<UserStatsSummary>({
		totalUsers: 0,
		activeUsers: 0,
		newUsers: 0,
	});
	const [userHeat, setUserHeat] = useState<UserHeatPoint[]>([]);
	const [actionLoading, setActionLoading] = useState(true);
	const [userInsightsLoading, setUserInsightsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const docketHeight = useDocketHeight();
	const router = useRouter();

	const revenueChartRef = useRef<ChartJS | null>(null);
	const vendorChartRef = useRef<ChartJS | null>(null);
	const topProductsChartRef = useRef<ChartJS | null>(null);

	useEffect(() => {
		// Set initial mobile state
		setIsMobile(window.innerWidth < 768);

		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const fetchStats = async () => {
		setStatsLoading(true);
		const cachedStats = localStorage.getItem(STATS_CACHE_KEY);
		if (cachedStats) {
			try {
				const { data, timestamp } = JSON.parse(cachedStats);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setStats(data);
					setStatsLoading(false);
					return;
				}
			} catch (error) {
				//(error);
			}
		}

		try {
			const response = await axiosInstance.get('/api/admin/dashboard/stats', {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.data && response.data.success) {
				setStats(response.data.data);
				localStorage.setItem(
					STATS_CACHE_KEY,
					JSON.stringify({ data: response.data.data, timestamp: Date.now() })
				);
			} else {
				setError(response.data.message || 'Failed to fetch dashboard stats');
			}
		} catch (err) {
			const error = err as any;
			setError(error.response?.data?.message || 'Error fetching dashboard stats');
		} finally {
			setStatsLoading(false);
		}
	};

	const fetchRevenue = async () => {
		setRevenueLoading(true);
		const cachedRevenue = localStorage.getItem(`${REVENUE_CACHE_KEY}_${days}`);
		if (cachedRevenue) {
			try {
				const { data, timestamp } = JSON.parse(cachedRevenue);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setRevenue(data);
					setRevenueLoading(false);
					return;
				}
			} catch (error) {
				//(error);
			}
		}

		try {
			const response = await axiosInstance.get('/api/admin/dashboard/revenue', {
				params: { days },
				headers: { Authorization: `Bearer ${token}` },
			});

			const revenueData = Array.isArray(response.data?.data)
				? response.data.data
				: Array.isArray(response.data)
					? response.data
					: [];

			if (response.data?.success === false) {
				setError(response.data?.message || 'Failed to fetch revenue data');
			}

			if (Array.isArray(revenueData)) {
				setRevenue(revenueData);
				localStorage.setItem(
					`${REVENUE_CACHE_KEY}_${days}`,
					JSON.stringify({ data: revenueData, timestamp: Date.now() })
				);
			}
		} catch (err) {
			const error = err as any;
			setError(error.response?.data?.message || 'Error fetching revenue data');
		} finally {
			setRevenueLoading(false);
		}
	};

	const fetchGrossRevenueTrend = async () => {
		setGrossRevenueLoading(true);
		const cacheKey = `${GROSS_REVENUE_TREND_CACHE_KEY}_${days}`;
		const cached = localStorage.getItem(cacheKey);
		if (cached) {
			try {
				const { data, timestamp } = JSON.parse(cached);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setGrossRevenue(Number(data.grossRevenue || 0));
					setGrossRevenueTrendText(String(data.trendText || '+0% vs last month'));
					setGrossRevenueLoading(false);
					return;
				}
			} catch (error) {
				//(error);
			}
		}

		try {
			const response = await axiosInstance.get('/api/admin/dashboard/gross-revenue-trend', {
				params: { days },
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.data?.success === false) {
				setError(response.data?.message || 'Failed to fetch gross revenue trend');
				return;
			}

			const payload = response.data?.data ?? response.data ?? {};
			const root =
				typeof payload === 'object' && payload !== null
					? (payload as Record<string, unknown>)
					: {};

			const toNumber = (value: unknown) => {
				const parsed = typeof value === 'number' ? value : Number(value);
				return Number.isFinite(parsed) ? parsed : 0;
			};

			const grossRevenueValue = toNumber(
				root['grossRevenue'] ??
					root['totalGrossRevenue'] ??
					root['totalRevenue'] ??
					root['revenue'] ??
					root['amount'] ??
					root['value']
			);

			const trendRaw =
				root['trendText'] ?? root['trendLabel'] ?? root['comparison'] ?? root['changeLabel'];
			const trendValue = toNumber(
				root['trendPercentage'] ??
					root['trendPercent'] ??
					root['percentageChange'] ??
					root['changePercent'] ??
					root['trend']
			);
			const trendText =
				typeof trendRaw === 'string' && trendRaw.trim().length > 0
					? trendRaw
					: `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}% vs last month`;

			setGrossRevenue(grossRevenueValue);
			setGrossRevenueTrendText(trendText);
			localStorage.setItem( 
				cacheKey,
				JSON.stringify({
					data: { grossRevenue: grossRevenueValue, trendText },
					timestamp: Date.now(),
				})
			);
		} catch (err) {
			const error = err as any;
			setError(error.response?.data?.message || 'Error fetching gross revenue trend');
		} finally {
			setGrossRevenueLoading(false);
		}
	};

	const getVendorsCacheKey = () =>
		`${VENDORS_CACHE_KEY}_${vendorsStartDate || 'all'}_${vendorsEndDate || 'all'
		}_${vendorsPage}`;

	const fetchVendorsSales = async () => {
		setVendorsLoading(true);
		const cacheKey = getVendorsCacheKey();
		const cached = localStorage.getItem(cacheKey);
		if (cached) {
			try {
				const { data, timestamp } = JSON.parse(cached);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setVendorsPaginated(data);
					setVendorsSales(data.data || []);
					setVendorsLoading(false);
					return;
				}
			} catch (err) {
				//(err);
			}
		}

		try {
			let url = `/api/admin/dashboard/vendors-sales-amount?page=${vendorsPage}`;
			if (vendorsStartDate) url += `&startDate=${vendorsStartDate}T00:00:00Z`;
			if (vendorsEndDate) url += `&endDate=${vendorsEndDate}T23:59:59Z`;
			const response = await axiosInstance.get(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.data && response.data.success) {
				const paginatedData = response.data.data;
				setVendorsPaginated(paginatedData);
				setVendorsSales(paginatedData.data || []);
				localStorage.setItem(
					cacheKey,
					JSON.stringify({ data: paginatedData, timestamp: Date.now() })
				);
			}
		} catch (err) {
			console.error('Error fetching vendors sales:', err);
		} finally {
			setVendorsLoading(false);
		}
	};

	const getTopProductsCacheKey = () =>
		`${TOP_PRODUCTS_CACHE_KEY}_${topProductsStartDate || 'all'}_${topProductsEndDate || 'all'
		}_${topProductsPage}`;

	const fetchTopProducts = async () => {
		setTopProductsLoading(true);
		const cacheKey = getTopProductsCacheKey();
		const cached = localStorage.getItem(cacheKey);
		if (cached) {
			try {
				const { data, timestamp } = JSON.parse(cached);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setTopProductsPaginated(data);
					setTopProducts(data.data || []);
					setTopProductsLoading(false);
					return;
				}
			} catch (err) {
				//(err);
			}
		}

		try {
			let url = `/api/admin/dashboard/top-products?page=${topProductsPage}`;
			if (topProductsStartDate)
				url += `&startDate=${topProductsStartDate}T00:00:00Z`;
			if (topProductsEndDate) url += `&endDate=${topProductsEndDate}T23:59:59Z`;
			const response = await axiosInstance.get(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.data && response.data.success) {
				const paginatedData = response.data.data;
				setTopProductsPaginated(paginatedData);
				setTopProducts(paginatedData.data || []);
				localStorage.setItem(
					cacheKey,
					JSON.stringify({ data: paginatedData, timestamp: Date.now() })
				);
			}
		} catch (err) {
			console.error('Error fetching top products:', err);
		} finally {
			setTopProductsLoading(false);
		}
	};

	const fetchTodaysSales = async () => {
		setTodaysLoading(true);
		try {
			const response = await axiosInstance.get(
				'/api/admin/dashboard/todays-sales',
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (response.data && response.data.success) {
				setTodaysSales(response.data.data.totalSales || 0);
			}
		} catch (err) {
			console.error("Error fetching today's sales:", err);
		} finally {
			setTodaysLoading(false);
		}
	};

	const fetchActionMetrics = async () => {
		if (!token) return;
		setActionLoading(true);
		const cached = localStorage.getItem(ACTION_METRICS_CACHE_KEY);
		if (cached) {
			try {
				const { data, timestamp } = JSON.parse(cached);
				if (data && Date.now() - timestamp < CACHE_TTL) {
					setOrdersToday(Number(data.ordersToday || 0));
					setPendingApprovals(Number(data.pendingApprovals || 0));
					setDelayedOrders(Number(data.delayedOrders || 0));
					setActionLoading(false);
					return;
				}
			} catch (error) {
				//(error);
			}
		}

		try {
			const [ordersTodayResponse, needsActionResponse] = await Promise.all([
				axiosInstance.get('/api/admin/dashboard/orders-today-count', {
					headers: { Authorization: `Bearer ${token}` },
				}),
				axiosInstance.get('/api/admin/dashboard/needs-action', {
					headers: { Authorization: `Bearer ${token}` },
				}),
			]);

			const toCount = (value: unknown): number => {
				const parsed = typeof value === 'number' ? value : Number(value);
				return Number.isFinite(parsed) ? parsed : 0;
			};

			const ordersTodayPayload =
				ordersTodayResponse?.data?.data ?? ordersTodayResponse?.data;
			const parsedOrdersToday =
				typeof ordersTodayPayload === 'object' && ordersTodayPayload !== null
					? toCount(
							(ordersTodayPayload as Record<string, unknown>)['ordersTodayCount'] ??
								(ordersTodayPayload as Record<string, unknown>)['ordersToday'] ??
								(ordersTodayPayload as Record<string, unknown>)['count'] ??
								(ordersTodayPayload as Record<string, unknown>)['total']
						)
					: toCount(ordersTodayPayload);

			const needsActionPayload =
				needsActionResponse?.data?.data ?? needsActionResponse?.data ?? {};
			const needsActionData =
				typeof needsActionPayload === 'object' && needsActionPayload !== null
					? (needsActionPayload as Record<string, unknown>)
					: {};

			const parsedPendingApprovals = toCount(
				needsActionData['pendingApprovals'] ??
					needsActionData['pendingVendorApprovals'] ??
					needsActionData['pendingVendors'] ??
					needsActionData['unapprovedVendors']
			);

			const parsedDelayedOrders = toCount(
				needsActionData['delayedOrders'] ??
					needsActionData['delayed'] ??
					needsActionData['ordersDelayed']
			);

			setOrdersToday(parsedOrdersToday);
			setPendingApprovals(parsedPendingApprovals);
			setDelayedOrders(parsedDelayedOrders);

			localStorage.setItem(
				ACTION_METRICS_CACHE_KEY,
				JSON.stringify({
					data: {
						ordersToday: parsedOrdersToday,
						pendingApprovals: parsedPendingApprovals,
						delayedOrders: parsedDelayedOrders,
					},
					timestamp: Date.now(),
				})
			);
		} catch (err) {
			console.error('Error fetching action metrics:', err);
		} finally {
			setActionLoading(false);
		}
	};

	const fetchUserInsights = async () => {
		if (!token) return;
		setUserInsightsLoading(true);

		const usersHeatCacheKey = `${USER_HEAT_CACHE_KEY}_20`;
		const cachedStats = localStorage.getItem(USER_STATS_CACHE_KEY);
		const cachedHeat = localStorage.getItem(usersHeatCacheKey);

		if (cachedStats && cachedHeat) {
			try {
				const parsedStats = JSON.parse(cachedStats);
				const parsedHeat = JSON.parse(cachedHeat);

				if (
					parsedStats?.data &&
					parsedHeat?.data &&
					Date.now() - Number(parsedStats.timestamp || 0) < CACHE_TTL &&
					Date.now() - Number(parsedHeat.timestamp || 0) < CACHE_TTL
				) {
					console.log(
						'[AdminDashboard] /api/admin/users/stats response (cached):',
						parsedStats.data
					);
					console.log(
						'[AdminDashboard] /api/admin/users/heat?limit=20 response (cached):',
						parsedHeat.data
					);
					setUserStatsSummary(parsedStats.data as UserStatsSummary);
					setUserHeat(parsedHeat.data as UserHeatPoint[]);
					setUserInsightsLoading(false);
					return;
				}
			} catch (error) {
				// Ignore malformed cache and fetch fresh data.
			}
		}

		try {
			const [usersStatsResponse, usersHeatResponse] = await Promise.all([
				axiosInstance.get('/api/admin/users/stats', {
					headers: { Authorization: `Bearer ${token}` },
				}),
				axiosInstance.get('/api/admin/users/heat', {
					params: { limit: 20 },
					headers: { Authorization: `Bearer ${token}` },
				}),
			]);

			console.log(
				'[AdminDashboard] /api/admin/users/stats response:',
				usersStatsResponse.data
			);
			console.log(
				'[AdminDashboard] /api/admin/users/heat?limit=20 response:',
				usersHeatResponse.data
			);

			const toCount = (value: unknown): number => {
				const parsed = typeof value === 'number' ? value : Number(value);
				return Number.isFinite(parsed) ? parsed : 0;
			};

			const usersStatsPayload =
				usersStatsResponse?.data?.data ?? usersStatsResponse?.data ?? {};
			const usersStatsRecord =
				typeof usersStatsPayload === 'object' && usersStatsPayload !== null
					? (usersStatsPayload as Record<string, unknown>)
					: {};

			const normalizedStats: UserStatsSummary = {
				totalUsers: toCount(
					usersStatsRecord['totalUsers'] ??
						usersStatsRecord['users'] ??
						usersStatsRecord['total'] ??
						usersStatsRecord['totalCustomers']
				),
				activeUsers: toCount(
					usersStatsRecord['activeUsers'] ??
						usersStatsRecord['onlineUsers'] ??
						usersStatsRecord['active']
				),
				newUsers: toCount(
					usersStatsRecord['newUsers'] ??
						usersStatsRecord['newUsersToday'] ??
						usersStatsRecord['new']
				),
			};

			const usersHeatPayload =
				usersHeatResponse?.data?.data ?? usersHeatResponse?.data ?? [];
			const usersHeatCandidate = Array.isArray(usersHeatPayload)
				? usersHeatPayload
				: typeof usersHeatPayload === 'object' && usersHeatPayload !== null
					? ((usersHeatPayload as Record<string, unknown>)['items'] ??
						(usersHeatPayload as Record<string, unknown>)['rows'] ??
						(usersHeatPayload as Record<string, unknown>)['heat'] ??
						[])
					: [];

			const normalizedHeat: UserHeatPoint[] = (Array.isArray(usersHeatCandidate)
				? usersHeatCandidate
				: [])
				.map((item, index) => {
					if (typeof item === 'object' && item !== null) {
						const row = item as Record<string, unknown>;
						return {
							label: String(
								row['label'] ??
									row['date'] ??
									row['day'] ??
									row['hour'] ??
									row['name'] ??
									`Point ${index + 1}`
							),
							value: toCount(

								row['value'] ?? row['count'] ?? row['total'] ?? row['users']

							),
						};
					}

					return {
						label: `Point ${index + 1}`,
						value: toCount(item),
					};
				})
				.slice(0, 20);

			setUserStatsSummary(normalizedStats);
			setUserHeat(normalizedHeat);

			localStorage.setItem(
				USER_STATS_CACHE_KEY,
				JSON.stringify({ data: normalizedStats, timestamp: Date.now() })
			);
			localStorage.setItem(
				usersHeatCacheKey,
				JSON.stringify({ data: normalizedHeat, timestamp: Date.now() })
			);
		} catch (error) {
			console.error('Error fetching user insights:', error);
		} finally {
			setUserInsightsLoading(false);
		}
	};

	useEffect(() => {
		if (todaysSales > 0) {
			const hours = Array.from(
				{ length: 24 },
				(_, i) => `${i.toString().padStart(2, '0')}:00`
			);
			let remaining = todaysSales;
			const values: number[] = [];
			for (let i = 0; i < 23; i++) {
				const rand = Math.random() * (remaining * 0.6) + todaysSales * 0.01;
				const clamped = Math.max(0, Math.min(rand, remaining));
				values.push(clamped);
				remaining -= clamped;
			}
			values.push(remaining);
			setTodaysSalesData(hours.map((h, i) => ({ label: h, value: values[i] || 0 })));
		}
	}, [todaysSales]);

	useEffect(() => {
		if (!token) {
			setError('No authentication token found. Please log in.');
			return;
		}
		Promise.all([
			fetchStats(),
			fetchRevenue(),
			fetchGrossRevenueTrend(),
			fetchVendorsSales(),
			fetchTopProducts(),
			fetchTodaysSales(),
			fetchActionMetrics(),
			fetchUserInsights(),
		]).catch(() => setError('Error during initial load'));
	}, [token]);

	
	useEffect(() => {
		if (token) fetchRevenue();
	}, [days, token]);

	useEffect(() => {
		if (token) fetchGrossRevenueTrend();
	}, [days, token]);

	useEffect(() => {
		if (token) fetchVendorsSales();
	}, [vendorsStartDate, vendorsEndDate, vendorsPage, token]);

	useEffect(() => {
		if (token) fetchTopProducts();
	}, [topProductsStartDate, topProductsEndDate, topProductsPage, token]);

	useEffect(() => {
		if (token) fetchTodaysSales();
	}, [token]);

	useEffect(() => {
		let disposed = false;

		const renderRevenueChart = async () => {
			const ctx = document.getElementById('revenue-chart') as HTMLCanvasElement | null;
			if (!ctx || revenue.length === 0) return;

			const { Chart } = await loadChartModule();
			if (disposed) return;

			if (revenueChartRef.current) {
				revenueChartRef.current.destroy();
			}

			const newChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: revenue.map((item) => item.date),
					datasets: [
						{
							label: 'Revenue',
							data: revenue.map((item) => parseFloat(item.revenue)),
							borderColor: '#F97316',
							backgroundColor: 'rgba(249, 115, 22, 0.1)',
							borderWidth: 2,
							pointRadius: 4,
							pointBackgroundColor: '#F97316',
							tension: 0.4,
						},
						{
							label: 'Order',
							data: revenue.map((item) => parseFloat(item.revenue) * 0.5),
							backgroundColor: 'transparent',
							borderWidth: 2,
							borderDash: [5, 5],
							pointRadius: 0,
							tension: 0.4,
							borderColor: 'rgba(249, 115, 22, 0.5)',
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							display: false,
						},
						tooltip: {
							callbacks: {
								label: (context) => {
									if (context.dataset.label === 'Revenue') {
										return `Rs. ${(context.parsed.y || 0).toLocaleString('en-IN')}`;
									} else {
										return `${context.parsed.y || 0}`;
									}
								},
							},
						},
					},
					scales: {
						x: {
							grid: {
								display: false,
							},
						},
						y: {
							beginAtZero: true,
							grid: {
								color: '#e5e7eb',
							},
							ticks: {
								callback: (value) => `Rs. ${value.toLocaleString('en-IN')}`,
							},
						},
					},
				},
			});

			if (disposed) {
				newChart.destroy();
				return;
			}

			revenueChartRef.current = newChart;
		};

		renderRevenueChart();

		return () => {
			disposed = true;
			if (revenueChartRef.current) {
				revenueChartRef.current.destroy();
				revenueChartRef.current = null;
			}
		};
	}, [revenue]);

	useEffect(() => {
		let disposed = false;

		const renderVendorChart = async () => {
			const ctx = document.getElementById('vendor-chart') as HTMLCanvasElement | null;
			if (!ctx || vendorsSales.length === 0) return;

			const { Chart } = await loadChartModule();
			if (disposed) return;

			if (vendorChartRef.current) {
				vendorChartRef.current.destroy();
			}
			const colors = [
				'#3B82F6',
				'#10B981',
				'#F59E0B',
				'#EF4444',
				'#8B5CF6',
				'#EC4899',
				'#14B8A6',
			];
			const chart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: vendorsSales.map((v) => v.businessName),
					datasets: [
						{
							label: 'Total Sales',
							data: vendorsSales.map((v) => v.totalSales),
							backgroundColor: vendorsSales.map(
								(_, i) => colors[i % colors.length]
							),
							borderColor: '#374151',
							borderWidth: 1,
						},
					],
				},
				options: {
					indexAxis: 'y',
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
					},
					scales: {
						x: {
							beginAtZero: true,
							ticks: {
								callback: (value: string | number) =>
									`Rs. ${Number(value).toLocaleString('en-IN')}`,
							},
						},
					},
				},
			});
			if (disposed) {
				chart.destroy();
				return;
			}

			vendorChartRef.current = chart;
		};

		renderVendorChart();

		return () => {
			disposed = true;
			if (vendorChartRef.current) {
				vendorChartRef.current.destroy();
				vendorChartRef.current = null;
			}
		};
	}, [vendorsSales]);

	useEffect(() => {
		let disposed = false;

		const renderTopProductsChart = async () => {
			const ctx = document.getElementById('top-products-chart') as HTMLCanvasElement | null;
			if (!ctx || topProducts.length === 0) return;

			const { Chart } = await loadChartModule();
			if (disposed) return;

			if (topProductsChartRef.current) {
				topProductsChartRef.current.destroy();
			}

			const colors = [
				'#3B82F6',
				'#10B981',
				'#F59E0B',
				'#EF4444',
				'#8B5CF6',
				'#EC4899',
				'#14B8A6',
			];

			const chart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: topProducts.map((p) => p.productName),
					datasets: [
						{
							label: 'Total Sales',
							data: topProducts.map((p) => p.totalSales),
							backgroundColor: topProducts.map(
								(_, i) => colors[i % colors.length]
							),
							borderColor: '#374151',
							borderWidth: 1,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								// Show full product name on hover
								title: function (context) {
									return context[0]?.label || '';
								},
								label: function (context) {
									return `Rs. ${(context.parsed.y || 0).toLocaleString('en-IN')}`;
								},
							},
						},
					},
					scales: {
						x: {
							ticks: {
								callback: function (value, index) {
									const label = String(this.getLabelForValue(Number(value)));
									const maxLength = 15; // Adjust number of visible characters
									return label.length > maxLength
										? label.slice(0, maxLength) + '…'
										: label;
								},
								maxRotation: 45, // Slight rotation for readability
								minRotation: 45,
								autoSkip: false, // Prevents skipping labels
							},
						},
						y: {
							beginAtZero: true,
							ticks: {
								callback: (value: string | number) =>
									`Rs. ${Number(value).toLocaleString('en-IN')}`,
							},
							grid: {
								color: '#e5e7eb',
							},
						},
					},
				},
			});

			if (disposed) {
				chart.destroy();
				return;
			}

			topProductsChartRef.current = chart;
		};

		renderTopProductsChart();

		return () => {
			disposed = true;
			if (topProductsChartRef.current) {
				topProductsChartRef.current.destroy();
				topProductsChartRef.current = null;
			}
		};
	}, [topProducts]);

	const handleVendorsPageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= (vendorsPaginated?.totalPage || 1)) {
			setVendorsPage(newPage);
		}
	};

	const handleTopProductsPageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= (topProductsPaginated?.totalPage || 1)) {
			setTopProductsPage(newPage);
		}
	};

	const renderSkeletonStatCard = () => (
		<div className="stat-card">
			<div className="stat-icon">
				<Skeleton
					type="avatar"
					width="3rem"
					height="3rem"
				/>
			</div>
			<div className="stat-content">
				<Skeleton
					type="text"
					width="80%"
				/>
				<Skeleton
					type="title"
					width="60%"
				/>
			</div>
		</div>
	);

	const handleDaysChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setDays(parseInt(event.target.value));
	};

	const renderPagination = (
		paginated: PaginatedData<any> | null,
		currentPage: number,
		onPageChange: (page: number) => void
	) => {
		if (!paginated) return null;
		return (
			<div className="pagination-container">
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className="pagination-btn"
				>
					Previous
				</button>
				<span className="pagination-info">
					Page {currentPage} of {paginated.totalPage} ({paginated.totalData}{' '}
					total)
				</span>
				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === paginated.totalPage}
					className="pagination-btn"
				>
					Next
				</button>
			</div>
		);
	};

	const renderDateFilters = (
		startDate: string,
		endDate: string,
		onStartChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
		onEndChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
		title: string
	) => (
		<div className="date-filters">
			<h3>{title}</h3>
			<div>
				<label>
					Start Date:
					<input
						type="date"
						value={startDate}
						onChange={onStartChange}
					/>
				</label>
				<label>
					End Date:
					<input
						type="date"
						value={endDate}
						onChange={onEndChange}
					/>
				</label>
			</div>
		</div>
	);

	const renderChartSkeleton = () => (
		<div className="chart-skeleton">
			<Skeleton
				type="title"
				width="100%"
			/>
			<Skeleton
				type="text"
				width="80%"
			/>
		</div>
	);

	if (error) {
		return (
			<div className="vendor-dash-container">
				<div className={`dashboard ${isMobile ? 'dashboard--mobile' : ''}`}>
<main
						className="dashboard__main"
						style={{
							paddingBottom: isMobile ? `${docketHeight + 24}px` : '24px',
						}}
					>
						<div
							style={{
								color: 'red',
								fontWeight: 500,
								textAlign: 'center',
								padding: '2rem',
							}}
						>
							{error}
						</div>
					</main>
				</div>
			</div>
		);
	}

	return (
		<div className="vendor-dash-container">
			<div className={`dashboard ${isMobile ? 'dashboard--mobile' : ''}`}>
<main
					className="dashboard__main"
					style={{
						paddingBottom: isMobile ? `${docketHeight + 24}px` : '24px',
					}}
				>
					<div className="dashboard__stats dashboard__stats--overview">
						<div className="stat-card">
							<div className="stat-icon">💸</div>
							<div className="stat-content">
								<h3 className="stat-title">Gross Revenue</h3>
								<p className="stat-value">
									{grossRevenueLoading
										? 'Loading...'
										: `Rs. ${Number(grossRevenue || 0).toLocaleString('en-IN')}`}
								</p>
								<p className="stat-subtext">
									{grossRevenueLoading ? 'Loading trend...' : grossRevenueTrendText}
								</p>
							</div>
						</div>
						<div className="stat-card">
							<div className="stat-icon">🏪</div>
							<div className="stat-content">
								<h3 className="stat-title">Active Vendors</h3>
								<p className="stat-value">{stats?.totalVendors || 0}</p>
								<p className="stat-subtext">Approved vendor partners</p>
							</div>
						</div>
						
						<div className="stat-card">
							<div className="stat-icon">📦</div>
							<div className="stat-content">
								<h3 className="stat-title">Orders Today</h3>
								<p className="stat-value">{ordersToday}</p>
								<p className="stat-subtext">Live order count</p>
							</div>
						</div>
						<div className="stat-card">
							<div className="stat-icon">👤</div>
							<div className="stat-content">
								<h3 className="stat-title">Active Users</h3>
								<p className="stat-value">
									{userInsightsLoading ? 'Loading...' : userStatsSummary.activeUsers}
								</p>
								<p className="stat-subtext">From admin users stats</p>
							</div>
						</div>
					</div>
					<div className="dashboard__stats">
						{statsLoading ? (
							<>
								{Array.from({ length: 8 }).map((_, i) => (
									<div key={i}>{renderSkeletonStatCard()}</div>
								))}
							</>
						) : stats ? (
							<>
								<StatsCard
									title="Total Sales"
									value={`Rs. ${Number(stats.totalSales).toLocaleString(
										'en-IN'
									)}`}
									iconType="sales"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Orders"
									value={stats.totalOrders}
									iconType="orders"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Customers"
									value={stats.totalCustomers}
									iconType="customers"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Users"
									value={userInsightsLoading ? 'Loading...' : userStatsSummary.totalUsers}
									iconType="customers"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Vendors"
									value={stats.totalVendors}
									iconType="vendors"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total Products"
									value={stats.totalProducts}
									iconType="products"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Delivered Revenue"
									value={`Rs. ${Number(
										stats.totalDeliveredRevenue
									).toLocaleString('en-IN')}`}
									iconType="sales"
									change={0}
									trend="up"
									timeframe=""
								/>
								<StatsCard
									title="Total shipping revenue"
									value={`Rs. ${Number(
										stats.totalShippingRevenue
									).toLocaleString('en-IN')}`}
									iconType="sales"
									change={0}
									trend="up"
									timeframe=""
								/>
							</>
						) : null}
					</div>

					<div className="section-card dashboard-needs-action">
						<h2>Needs Action</h2>
						{actionLoading ? (
							<p>Loading alerts...</p>
						) : (
							<div className="needs-action-list">
								{pendingApprovals > 0 && (
									<div className="needs-action-item" onClick={() => router.push('/admin/vendors')} style={{ cursor: 'pointer' }}>
										<span className="needs-action-label">Pending Vendor Approvals</span>
										<span className="needs-action-count">{pendingApprovals}</span>
									</div>
								)}
								{delayedOrders > 0 && (
									<div className="needs-action-item" onClick={() => router.push('/admin/vendor')} style={{ cursor: 'pointer' }}>
										<span className="needs-action-label">Delayed Orders</span>
										<span className="needs-action-count">{delayedOrders}</span>
									</div>
								)}
							</div>
						)}
					</div>
					<div className="section-card dashboard-needs-action">
						<h2>User Insights</h2>
						{userInsightsLoading ? (
							<p>Loading user analytics...</p>
						) : (
							<>
								<div className="needs-action-list">
									{userStatsSummary.totalUsers > 0 && (
										<div className="needs-action-item">
											<span className="needs-action-label">Total Users</span>
											<span className="needs-action-count">{userStatsSummary.totalUsers}</span>
										</div>
									)}
									{userStatsSummary.newUsers > 0 && (
										<div className="needs-action-item">
											<span className="needs-action-label">New Users</span>
											<span className="needs-action-count">{userStatsSummary.newUsers}</span>
										</div>
									)}
								</div>
								{userHeat.filter(point => point.value > 0).length > 0 ? (
									<div className="needs-action-list" style={{ marginTop: '0.75rem' }}>
										{userHeat.filter(point => point.value > 0).slice(0, 5).map((point, index) => (
											<div
												className="needs-action-item"
												key={`${point.label}-${index}`}
												onClick={() => {}}
												style={{ cursor: 'pointer' }}
											>
												<span className="needs-action-label">{point.label}</span>
												<span className="needs-action-count">{point.value}</span>
											</div>
										))}
									</div>
								) : (
									<p style={{ marginTop: '0.75rem' }}>No user heat data available.</p>
								)}
							</>
						)}
					</div>
					<div className="dashboard__two-columns">
						<div className="dashboard__column">
							<div className="section-card revenue-analytics">
								<div className="revenue-analytics__legend">
									<div className="legend-item">
										<div className="legend-item__color legend-item__color--revenue"></div>
										<span className="legend-item__label">Revenue</span>
									</div>
									<div className="legend-item">
										<div className="legend-item__color legend-item__color--order"></div>
										<span className="legend-item__label">Order</span>
									</div>
								</div>
								<div className="revenue-analytics__chart">
									{revenueLoading ? (
										renderChartSkeleton()
									) : revenue.length > 0 ? (
										<canvas id="revenue-chart"></canvas>
									) : (
										<div className="dashboard-no-data">
											<p>No data available</p>
										</div>
									)}
								</div>
								<div className="days-selector-container">
									<select
										className="days-selector"
										value={days}
										onChange={handleDaysChange}
									>
										<option value="7">Last 7 Days</option>
										<option value="15">Last 15 Days</option>
										<option value="30">Last 30 Days</option>
									</select>
								</div>
							</div>
						</div>
						<div className="dashboard__column">
							<div
								className="section-card todays-sales-section"
								style={{ height: '100%' }}
							>
								<h2>Today's Sales</h2>
								<div className="chart-container">
									{todaysLoading ? (
										renderChartSkeleton()
									) : todaysSalesData.length > 0 ? (
										<canvas id="todays-sales-chart"></canvas>
									) : (
										<div
											className="dashboard-no-data"
											style={{ height: '350px' }}
										>
											<p>No data available</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
					<div className="dashboard-sections">
						<div className="section-card">
							{renderDateFilters(
								vendorsStartDate,
								vendorsEndDate,
								(e) => setVendorsStartDate(e.target.value),
								(e) => setVendorsEndDate(e.target.value),
								'Vendors Sales Amount Filters'
							)}
							<h2>Vendors Sales Amount</h2>
							{vendorsLoading ? (
								renderChartSkeleton()
							) : vendorsSales.length > 0 ? (
								<>
									<div className="chart-container">
										<canvas id="vendor-chart"></canvas>
									</div>
									{renderPagination(
										vendorsPaginated,
										vendorsPage,
										handleVendorsPageChange
									)}
								</>
							) : (
								<div className="dashboard-no-data">
									<p>No data available</p>
								</div>
							)}
						</div>
						<div className="section-card">
							{renderDateFilters(
								topProductsStartDate,
								topProductsEndDate,
								(e) => setTopProductsStartDate(e.target.value),
								(e) => setTopProductsEndDate(e.target.value),
								'Top Products Filters'
							)}
							<h2>Top Selling Products</h2>
							{topProductsLoading ? (
								renderChartSkeleton()
							) : topProducts.length > 0 ? (
								<>
									<div className="chart-container">
										<canvas id="top-products-chart"></canvas>
									</div>
									{renderPagination(
										topProductsPaginated,
										topProductsPage,
										handleTopProductsPageChange
									)}
								</>
							) : (
								<div className="dashboard-no-data">
									<p>No data available</p>
								</div>
							)}
						</div>
					</div>
					<div className="dashboard__two-columns">
						<div className="dashboard__column">
							<RevenueByCategory />
						</div>
						<div className="dashboard__column">
							<RevenueBySubCategory />
						</div>
					</div>
					<div>
						<RevenueByVendor />
					</div>
				</main>
			</div>
		</div>
	);
}

