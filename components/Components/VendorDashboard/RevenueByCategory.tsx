'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '@/lib/config';
import { useVendorAuth } from '@/lib/context/VendorAuthContext';

interface RevenueData {
    category: string;
    revenue: string;
}

const VendorRevenueByCategory = () => {
    const [data, setData] = useState<RevenueData[]>([]);
    const { authState } = useVendorAuth();
    const { token, isAuthenticated } = authState;

    if (!isAuthenticated) {
        //("User is not authenticated")
    } else {
        //("--------Token---------", token)
    }

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/vendor/dashboard/analytics/revenue-by-category`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((res) => {
                //('API Response:', res);
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setData(res.data);
                } else {
                    setData([]);
                }
            })
            .catch((err) => {
                console.error(err);
                setData([]);
            });
    }, []);

    return (
        <div style={styles['container']}>
            <h1 style={styles['title']}>Revenue by Category</h1>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={data.map(d => ({ ...d, revenue: parseFloat(d.revenue) }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `Rs. ${value.toLocaleString()}`} />
                        <Bar dataKey="revenue" fill="#10B981" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div style={styles['noData']}>No data available</div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '100%',
        minHeight: '180px',
        padding: '18px 22px 20px',
        backgroundColor: '#ffffff',
        border: '1px solid #e7ebf1',
        borderRadius: '16px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
        margin: '48px 0 0',
        boxSizing: 'border-box',
    },
    title: {
        fontSize: '20px',
        fontWeight: 600,
        lineHeight: 1.25,
        marginBottom: '34px',
        color: '#172B4D',
        textAlign: 'center',
        marginTop: 0,
    },
    noData: {
        textAlign: 'center',
        color: '#98A2B3',
        fontSize: '13px',
        fontWeight: 400,
        padding: '30px 0 18px',
    },
};

export default VendorRevenueByCategory;
