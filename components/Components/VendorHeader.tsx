'use client';

import React, { useState, useRef, useEffect } from "react";
import { useVendorAuth } from "@/lib/context/VendorAuthContext";
import { useRouter } from "next/navigation";
import { VendorAuthService } from "@/lib/services/vendorAuthService";

interface VendorHeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

const VendorHeader: React.FC<VendorHeaderProps> = ({ title, onSearch, showSearch = true }) => {
  const { authState } = useVendorAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <>
      <header
        className="dashboard__header"
        style={{
          height: 56,
          minHeight: 56,
          boxSizing: 'border-box',
          gap: 12,
          overflow: 'hidden',
        }}
      >
        <h1
          className="dashboard__title"
          style={{
            margin: 0,
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
        <div className="dashboard__user" ref={dropdownRef}>
          <div className="dashboard__avatar">
            <span className="dashboard__avatar-text">
              {authState.vendor?.businessName ? authState.vendor.businessName.charAt(0).toUpperCase() : "DV"}
            </span>
          </div>
          <div className="dashboard__user-info" style={{ minWidth: 0, maxWidth: 320 }}>
            <p
              className="dashboard__username"
              style={{ margin: 0, lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {authState.vendor?.businessName || "Unknown Vendor"}
            </p>
            <p
              className="dashboard__email"
              style={{ margin: 0, lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {authState.vendor?.email || "Unknown Email"}
            </p>
          </div>
          <button className="dashboard__dropdown-button" onClick={() => setDropdownOpen(v => !v)}>
            <span className="dashboard__dropdown-icon"></span>
          </button>
          {dropdownOpen && (
            <div className="dashboard__dropdown-menu">
              <button className="dashboard__dropdown-item" onClick={() => { setDropdownOpen(false); router.push("/"); }}>Home</button>
              <button className="dashboard__dropdown-item" onClick={() => { setDropdownOpen(false); VendorAuthService.comprehensiveLogout(); }}>Logout</button>
            </div>
          )}
        </div>
      </header>
      {showSearch && onSearch && (
        <div className="dashboard__search-container">
          <div className="dashboard__search">
            <input
              type="text"
              placeholder="Search"
              className="dashboard__search-input"
              onChange={handleInputChange}
            />
            <span className="dashboard__search-icon"></span>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorHeader; 