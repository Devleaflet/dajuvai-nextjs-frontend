'use client';

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import "@/styles/Notifications.css";
import { Sidebar } from "@/components/Components/Sidebar";
import axiosInstance from "@/lib/api/axiosInstance";
import { useAuth } from "@/lib/context/AuthContext";
import VendorHeader from "@/components/Components/VendorHeader";

interface Notification {
  id: number;
  type: string;
  title: string;
  time: string;
  read: boolean;
}

export function Notifications() {
  const [isMobile, setIsMobile] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    setIsMobile(window.innerWidth < 1000);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const isVendor = pathname === "/vendor/notifications";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [unreadCount, setUnreadCount] = useState(0);

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getTypeForIcon = (apiType: string) => {
    switch (apiType) {
      case "ORDER_PLACED": return "order";
      case "VENDOR_APPROVED": return "vendor";
      default: return "system";
    }
  };

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axiosInstance.get("/api/notification", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data && response.data.success) {
          const mappedNotifications: Notification[] = response.data.data.map((item: any) => ({
            id: item.id,
            type: getTypeForIcon(item.type),
            title: `${item.title}: ${item.message}`,
            time: formatTime(item.createdAt),
            read: item.isRead
          }));
          setNotifications(mappedNotifications);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchNotifications();
  }, [token]);

  const markAsRead = async (id: number) => {
    try {
      await axiosInstance.patch(`/api/notification/${id}`, { isRead: true }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.type === 'order') {
      const match = notification.title.match(/#(\d+)/);
      if (match) {
        const orderId = match[1];
        const path = isVendor ? `/vendor-orders?orderId=${orderId}` : `/admin-orders?orderId=${orderId}`;
        router.push(path);
      }
    }
  };

  const filteredNotifications = activeTab === "Unread"
    ? notifications.filter(n => !n.read)
    : notifications;

  const getIcon = (type: string) => {
    switch (type) {
      case "order": return "🛒";
      case "vendor": return "🏪";
      case "system": return "⚙️";
      default: return "📝";
    }
  };

  const notificationsContent = (
    <div className={`notifications-main ${isMobile ? "notifications-main--mobile" : ""}`}>
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <span className="unread-badge">({unreadCount} Unread)</span>
        </div>
        <div className="tabs">
          <button
            className={`tab ${activeTab === "All" ? "active" : ""}`}
            onClick={() => setActiveTab("All")}
          >
            All
          </button>
          <button
            className={`tab ${activeTab === "Unread" ? "active" : ""}`}
            onClick={() => setActiveTab("Unread")}
          >
            Unread
          </button>
        </div>
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.read ? "read" : "unread"}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {getIcon(notification.type)}
              </div>
              <div className="notification-content">
                <p className="notification-title">{notification.title}</p>
                <span className="notification-time">{notification.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isVendor) {
    return notificationsContent;
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div style={{ flex: 1 }}>
        <VendorHeader
          showSearch={false}
          title="Notification"
        />
        {notificationsContent}
      </div>
    </div>
  );
}