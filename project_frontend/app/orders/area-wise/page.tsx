'use client';
import { useAreaListQuery } from '@/redux/feature/areaSlice'
import { useAreaWiseOrdersQuery } from '@/redux/feature/orderSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';

interface Order {
    order_id: number;
    invoice_number: string;
    full_name: string;
    phone: string;
    shop_name: string;
    total_amount: number;
    final_amount: number;
    delivery_charge: number;
    special_bonus: number;
    area: string;
    order_status: string;
    order_date: string;
}

interface AreaData {
    area_id: number;
    area_name: string;
    is_active: boolean;
}

export default function AreaWiseOrders() {
    const [selectedArea, setSelectedArea] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const { data: areaListData } = useAreaListQuery(undefined);
    const { data: areaWiseOrdersData } = useAreaWiseOrdersQuery({
        area: selectedArea || undefined,
        status: statusFilter || undefined,
    });

    const orders: Order[] = areaWiseOrdersData?.data || [];
    const areas: AreaData[] = areaListData?.data || [];

    const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    // Get unique areas from orders
    const ordersGroupedByArea = useMemo(() => {
        const grouped: { [key: string]: Order[] } = {};
        orders.forEach((order) => {
            if (!grouped[order.area]) {
                grouped[order.area] = [];
            }
            grouped[order.area].push(order);
        });
        return grouped;
    }, [orders]);

    // Filter orders based on selected area and status
    const filteredOrders = useMemo(() => {
        return orders;
    }, [orders]);

    // Calculate statistics
    const stats = useMemo(() => {
        return {
            totalOrders: filteredOrders.length,
            totalAmount: filteredOrders.reduce((sum, order) => sum + order.final_amount, 0),
            totalDeliveryCharge: filteredOrders.reduce((sum, order) => sum + order.delivery_charge, 0),
        };
    }, [filteredOrders]);

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            pending: 'text-red-400',
            processing: 'text-orange-400',
            shipped: 'text-cyan-400',
            delivered: 'text-green-400',
            cancelled: 'text-gray-400',
            due: 'text-yellow-400',
        };
        return colors[status] || 'text-gray-400';
    };


    return (
        <div className="text-white pt-6 px-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Area Wise Orders</h1>
                <p className="text-gray-400">Manage and view orders by area</p>
            </div>

            {/* Filters Section */}
            <div className="bg-[#23252b] rounded-lg p-6 mb-6 border border-gray-600">
                <div className="flex items-end gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <Label className="text-sm text-gray-400 mb-2 block">Area</Label>
                        <Select
                            value={selectedArea?.toString() || 'all'}
                            onValueChange={(value) => setSelectedArea(value === 'all' ? null : parseInt(value))}
                        >
                            <SelectTrigger className="bg-[#2c2e33] border-gray-600">
                                <SelectValue placeholder="Select Area" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2a2a2a] border-gray-600">
                                <SelectGroup>
                                    <SelectItem value="all">All Areas</SelectItem>
                                    {areas.map((area) => (
                                        <SelectItem className='text-white' key={area.area_id} value={area.area_id.toString()}>
                                            {area.area_name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <Label className="text-sm text-gray-400 mb-2 block">Order Status</Label>
                        <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                            <SelectTrigger className="bg-[#2c2e33] border-gray-600">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2a2a2a] border-gray-600">
                                <SelectGroup>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {statusOptions.map((status) => (
                                        <SelectItem key={status} value={status} className="capitalize text-white">
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={() => {
                            setSelectedArea(null);
                            setStatusFilter('');
                        }}
                        className="bg-gray-600 hover:bg-gray-700"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Clear
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#23252b] rounded-lg p-4 border border-green-600/30">
                    <p className="text-gray-400 text-sm mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-green-400">{stats.totalOrders}</p>
                </div>
                <div className="bg-[#23252b] rounded-lg p-4 border border-purple-600/30">
                    <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-purple-400">৳{stats.totalAmount.toFixed(2)}</p>
                </div>

            </div>

            {/* Table Section */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-600 p-4">
                {filteredOrders.length > 0 ? (
                    <>
                        {/* Table Header */}
                        <div className="mb-4 pb-4 border-b border-gray-600">
                            <h2 className="text-lg font-semibold text-white">
                                {selectedArea
                                    ? `Orders in ${areas.find((a) => a.area_id === selectedArea)?.area_name}`
                                    : 'All Area Orders'}
                            </h2>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-600">
                                        <th className="text-left p-3 text-gray-300 font-semibold">Invoice</th>
                                        <th className="text-left p-3 text-gray-300 font-semibold">Customer</th>
                                        <th className="text-left p-3 text-gray-300 font-semibold">Area</th>
                                        <th className="text-left p-3 text-gray-300 font-semibold">Shop</th>
                                        <th className="text-left p-3 text-gray-300 font-semibold">Phone</th>
                                        <th className="text-right p-3 text-gray-300 font-semibold">Amount</th>
                                        <th className="text-right p-3 text-gray-300 font-semibold">Delivery</th>
                                        <th className="text-center p-3 text-gray-300 font-semibold">Status</th>
                                        <th className="text-left p-3 text-gray-300 font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order, idx) => (
                                        <tr key={order.order_id} className="border-b border-gray-700 hover:bg-gray-700/30 transition">
                                            <td className="p-3 text-white font-medium">{order.invoice_number}</td>
                                            <td className="p-3 text-gray-300">{order.full_name}</td>
                                            <td className="p-3 text-gray-300">{order.area}</td>
                                            <td className="p-3 text-gray-300">{order.shop_name}</td>
                                            <td className="p-3 text-gray-300">{order.phone}</td>
                                            <td className="p-3 text-right text-white font-medium">৳{order.final_amount.toFixed(2)}</td>
                                            <td className="p-3 text-right text-gray-300">৳{order.delivery_charge.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`${getStatusColor(order.order_status)} font-semibold capitalize`}>
                                                    {order.order_status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-300">
                                                {new Date(order.order_date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Footer */}
                        <div className="mt-6 pt-4 border-t border-gray-600 grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-gray-400 text-sm">Total Orders</p>
                                <p className="text-xl font-bold text-white">{stats.totalOrders}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Grand Total</p>
                                <p className="text-xl font-bold text-green-400">৳{stats.totalAmount.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Delivery Charges</p>
                                <p className="text-xl font-bold text-yellow-400">৳{stats.totalDeliveryCharge.toFixed(2)}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No orders found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
