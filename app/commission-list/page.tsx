"use client";

import React, { useState, useMemo } from "react";

interface CommissionRow {
  level1: string;
  level2: string;
  level3: string;
  commission: number;
}

const commissionData: CommissionRow[] = [
  {
    level1: "Bags",
    level2: "Bags",
    level3:
      "Women Bags, Man Bags, Kids Bags, Travel, Laptops, Tablet, Camera Bags & Cases",
    commission: 15,
  },
  {
    level1: "Bed & Bathroom",
    level2: "Bathroom",
    level3:
      "Toilet Brushes, Bathroom Mirrors, Bathroom Counter Storage, Toilet Roll Holders, Blankets, Bed Sheets, Bed Accessories",
    commission: 13,
  },
  {
    level1: "Cameras",
    level2: "Camera Accessories",
    level3: "Camera Accessories",
    commission: 14,
  },
  {
    level1: "Cameras",
    level2: "Drones",
    level3: "Drones, Drone Accessories",
    commission: 5,
  },
  {
    level1: "Cameras",
    level2: "DSLR",
    level3: "DSLR Sets, Body Only",
    commission: 5,
  },
  {
    level1: "Cameras",
    level2: "Gadgets & Other Cameras",
    level3: "Gadgets & Other Cameras",
    commission: 5,
  },
  { level1: "Cameras", level2: "Lenses", level3: "Lenses", commission: 5 },
  {
    level1: "Phones & Tablets",
    level2: "Mobiles, Phone & Tablets",
    level3: "Landline Phones, Smart Phone, IPhone and Tablets",
    commission: 5,
  },
  {
    level1: "Phones & Tablets",
    level2: "Mobiles, Phone & Tablets",
    level3: "Mobile Accessories, Tablets Accessories",
    commission: 15,
  },
  {
    level1: "Computers & Laptops",
    level2: "Computer Accessories",
    level3: "Computer Accessories",
    commission: 14,
  },
  {
    level1: "Computers & Laptops",
    level2: "Laptops",
    level3: "Laptops, MacBooks, Chromebooks",
    commission: 5,
  },
  {
    level1: "Computers & Laptops",
    level2: "Desktops",
    level3: "Desktop PCs, All-in-One PCs",
    commission: 5,
  },
  {
    level1: "Electronics",
    level2: "Audio",
    level3: "Headphones, Earphones, Speakers, Soundbars",
    commission: 10,
  },
  {
    level1: "Electronics",
    level2: "TV & Home Theater",
    level3: "Televisions, Projectors, Media Players",
    commission: 8,
  },
  {
    level1: "Electronics",
    level2: "Wearables",
    level3: "Smart Watches, Fitness Bands, Smart Glasses",
    commission: 10,
  },
  {
    level1: "Electronics",
    level2: "Gaming",
    level3: "Gaming Consoles, Controllers, Gaming Accessories",
    commission: 8,
  },
  {
    level1: "Fashion",
    level2: "Men's Clothing",
    level3: "T-Shirts, Shirts, Trousers, Jackets, Suits",
    commission: 15,
  },
  {
    level1: "Fashion",
    level2: "Women's Clothing",
    level3: "Tops, Dresses, Kurta, Sarees, Leggings",
    commission: 15,
  },
  {
    level1: "Fashion",
    level2: "Kids' Clothing",
    level3: "Boys Clothing, Girls Clothing, Baby Clothing",
    commission: 15,
  },
  {
    level1: "Fashion",
    level2: "Footwear",
    level3: "Sneakers, Sandals, Heels, Boots, Sports Shoes",
    commission: 13,
  },
  {
    level1: "Home & Living",
    level2: "Kitchen",
    level3: "Cookware, Kitchen Appliances, Utensils, Storage",
    commission: 12,
  },
  {
    level1: "Home & Living",
    level2: "Furniture",
    level3: "Sofas, Beds, Tables, Chairs, Wardrobes",
    commission: 10,
  },
  {
    level1: "Home & Living",
    level2: "Decor",
    level3: "Wall Art, Frames, Vases, Clocks, Candles",
    commission: 12,
  },
  {
    level1: "Sports & Outdoor",
    level2: "Exercise & Fitness",
    level3: "Gym Equipment, Yoga Mats, Resistance Bands",
    commission: 10,
  },
  {
    level1: "Sports & Outdoor",
    level2: "Outdoor Recreation",
    level3: "Trekking Gear, Camping, Cycling Accessories",
    commission: 10,
  },
  {
    level1: "Beauty & Health",
    level2: "Skincare",
    level3: "Face Wash, Moisturizers, Serums, Sunscreen",
    commission: 14,
  },
  {
    level1: "Beauty & Health",
    level2: "Hair Care",
    level3: "Shampoo, Conditioner, Hair Oil, Hair Styling",
    commission: 13,
  },
  {
    level1: "Beauty & Health",
    level2: "Health & Wellness",
    level3: "Supplements, Vitamins, Medical Devices",
    commission: 10,
  },
  {
    level1: "Books & Stationery",
    level2: "Books",
    level3: "Academic Books, Fiction, Non-Fiction, Comics",
    commission: 8,
  },
  {
    level1: "Books & Stationery",
    level2: "Stationery",
    level3: "Pens, Notebooks, Art Supplies, Office Supplies",
    commission: 12,
  },
  {
    level1: "Groceries",
    level2: "Food & Beverages",
    level3: "Snacks, Beverages, Instant Food, Dairy Products",
    commission: 5,
  },
  {
    level1: "Groceries",
    level2: "Personal Care",
    level3: "Soaps, Toothpaste, Deodorants, Tissue",
    commission: 8,
  },
  {
    level1: "Automotive",
    level2: "Car Accessories",
    level3: "Car Covers, Seat Covers, Dash Cameras, Tools",
    commission: 10,
  },
  {
    level1: "Automotive",
    level2: "Bike Accessories",
    level3: "Helmets, Locks, Bike Covers, Lights",
    commission: 10,
  },
  {
    level1: "Toys & Games",
    level2: "Toys",
    level3: "Action Figures, Dolls, Building Blocks, Board Games",
    commission: 12,
  },
  {
    level1: "Toys & Games",
    level2: "Baby Products",
    level3: "Baby Clothing, Baby Toys, Feeding Accessories",
    commission: 12,
  },
];

export default function CommissionListPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return commissionData;
    const q = search.toLowerCase();
    return commissionData.filter(
      (row) =>
        row.level3.toLowerCase().includes(q) ||
        row.level2.toLowerCase().includes(q) ||
        row.level1.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    /* Gray page background */
    <div
      style={{
        backgroundColor: "#e8e8e8",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {/* White rounded card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          overflow: "hidden",
          maxWidth: "1320px",
          margin: "0 auto",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Orange header — full width inside card, no border-radius needed */}
        <div
          style={{
            backgroundColor: "#e8721c",
            padding: "38px 24px 34px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: "700",
              margin: "0 0 8px 0",
              letterSpacing: "-0.3px",
            }}
          >
            Commission List
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.88)",
              fontSize: "14px",
              margin: 0,
              fontWeight: "400",
            }}
          >
            Detailed breakdown of commission rates across categories
          </p>
        </div>

        {/* White body */}
        <div style={{ padding: "28px 32px 40px" }}>
          {/* Search bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                border: "1px solid #d1d5db",
                borderRadius: "24px",
                padding: "10px 20px",
                width: "440px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by Category Level 3..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  color: "#374151",
                  background: "transparent",
                  width: "100%",
                }}
              />
            </div>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <th style={{ ...thStyle, width: "160px" }}>Category Level 1</th>
                <th style={{ ...thStyle, width: "200px" }}>Category Level 2</th>
                <th style={thStyle}>Category Level 3</th>
                <th style={{ ...thStyle, textAlign: "right", width: "130px" }}>
                  Commission
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: "48px",
                      color: "#9ca3af",
                      fontSize: "14px",
                    }}
                  >
                    No categories found matching &quot;{search}&quot;
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid #f0f0f0",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <td style={tdStyle}>{row.level1}</td>
                    <td style={tdStyle}>{row.level2}</td>
                    <td style={tdStyle}>{row.level3}</td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "right",
                        color: "#3730a3",
                        fontWeight: "600",
                      }}
                    >
                      {row.commission}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "13px 16px",
  textAlign: "left",
  fontWeight: "700",
  color: "#111827",
  fontSize: "13.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  color: "#374151",
  fontSize: "13.5px",
  verticalAlign: "top",
  lineHeight: "1.55",
};
