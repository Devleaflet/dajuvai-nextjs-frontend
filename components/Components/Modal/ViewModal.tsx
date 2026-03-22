import React from "react";
import { Order, OrderDetail } from "@/components/Components/Types/Order";
import "./ViewModal.css";

interface ViewModalProps {
  show: boolean;
  onClose: () => void;
  order: Order | null;
  orderDetail: OrderDetail | null;
}

const ViewModal: React.FC<ViewModalProps> = ({ show, onClose, order, orderDetail }) => {
  if (!show || !order || !orderDetail) return null;

  const toNumber = (value: string | number | undefined): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const subtotal = orderDetail.orderItems.reduce((sum, item) => sum + (toNumber(item.price) * item.quantity), 0);
  const shippingFee = toNumber(orderDetail.shippingFee);
  const total = subtotal + shippingFee;
  const customerName = orderDetail.orderedBy.username || orderDetail.orderedBy.name || "Unknown Customer";
  const customerEmail = orderDetail.orderedBy.email || "N/A";
  const shippingAddress = orderDetail.shippingAddress || { province: "N/A", city: "N/A", district: "N/A" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order #{order.id}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h3>Order Summary</h3>
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping Fee</span>
                <span>Rs. {shippingFee.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3>Order Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Order Date</span>
                <span className="value">{orderDetail.createdAt ? new Date(orderDetail.createdAt).toLocaleString() : "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="label">Payment Method</span>
                <span className="value">{orderDetail.paymentMethod || "Unknown"}</span>
              </div>
              <div className="detail-item">
                <span className="label">Order Status</span>
                <span className="value">{orderDetail.status || "pending"}</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3>Customer Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Name</span>
                <span className="value">{customerName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email</span>
                <span className="value">{customerEmail}</span>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3>Shipping Address</h3>
            <div className="address-box">
              <p>{`${shippingAddress.province || "N/A"}, ${shippingAddress.city || "N/A"}, ${shippingAddress.district || "N/A"}`}</p>
              {(shippingAddress.localAddress || shippingAddress.streetAddress) && (
                <p className="local-address">{shippingAddress.localAddress || shippingAddress.streetAddress}</p>
              )}
            </div>
          </div>

          <div className="modal-section">
            <h3>Order Items</h3>
            <div className="order-items">
              {orderDetail.orderItems.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="item-details">
                    <h4>{item.product.name}</h4>
                    <p className="vendor">Vendor: {item.vendor.businessName || item.vendor.name || "Unknown Vendor"}</p>
                  </div>
                  <div className="item-price">
                    <span className="quantity">Qty: {item.quantity}</span>
                    <span className="price">Rs. {(toNumber(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
