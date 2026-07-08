'use client';

import { useState } from "react";
import { Trash } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    useCancelStockMutation,
    useConfirmStockMutation,
    useCreateStockMutation,
    useDeleteBatchMutation,
    useSearchProductQuery,
    useStockDataQuery,
} from "@/redux/feature/stockSlice";

type SearchProduct = {
    product_id: number;
    product_name: string;
    generic_name: string;
    stock_quantity: number;
    cost_price: number | string;
    selling_price: number | string;
    mrp: number | string;
};

type StockBatchProduct = {
    id: number;
    product: string;
    old_stock?: number;
    stock: number;
    cost_price: string;
    mrp: string;
    selling_price: string;
    total: string;
};

type StockBatchSummary = {
    batch_id?: string;
    products?: StockBatchProduct[];
    total_value?: string;
};

type SearchProductsResponse = {
    data?: SearchProduct[];
};

type MutationResponse = {
    batch_id?: string;
    message?: string;
};

type ApiError = {
    data?: {
        message?: string;
    };
};

export default function Stock() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
    const [stock, setStock] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [stockData, setStockData] = useState<string | null>(null);
    const [mrp, setMrp] = useState("");
    const [stockQuantity, setStockQuantity] = useState<number>(0);

    const { data: searchResults } = useSearchProductQuery(searchQuery, {
        skip: !searchQuery,
    }) as { data?: SearchProductsResponse };
    const [createStock] = useCreateStockMutation();
    const [confirmStock] = useConfirmStockMutation();
    const [cancelStock] = useCancelStockMutation();
    const { data: stockDatas, refetch } = useStockDataQuery(stockData || "all") as {
        data?: StockBatchSummary;
        refetch: () => Promise<unknown>;
    };
    const [deleteBatch] = useDeleteBatchMutation();

    const handleProductSelect = (product: SearchProduct) => {
        setSelectedProduct(product);
        setSearchQuery(`${product.product_name} (${product.generic_name})`);
        setStock(product.stock_quantity.toString());
        setCostPrice(product.cost_price.toString());
        setSellingPrice(product.selling_price.toString());
        setMrp(product.mrp.toString());
    };

    const resetForm = () => {
        setSelectedProduct(null);
        setSearchQuery("");
        setStock("");
        setCostPrice("");
        setSellingPrice("");
        setMrp("");
        setStockQuantity(0);
    };

    const handleAddStock = async () => {
        if (!selectedProduct || !stock || !costPrice || !sellingPrice || !mrp) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (
            [stock, costPrice, sellingPrice, mrp].some((value) =>
                Number.isNaN(Number(value))
            )
        ) {
            toast.error("Stock, Cost Price, Selling Price, and MRP must be valid numbers.");
            return;
        }

        const stockDataPayload = {
            product_id: Number(selectedProduct.product_id),
            new_stock_quantity: Number(stockQuantity),
            new_cost_price: Number(costPrice),
            new_selling_price: Number(sellingPrice),
            mrp: Number(mrp),
        };

        try {
            const res = (await createStock(stockDataPayload).unwrap()) as MutationResponse;
            setStockData(res.batch_id || null);
            toast.success(res.message || "Stock added successfully!");
            await refetch();
            resetForm();
        } catch (error) {
            console.error("Failed to add stock:", error);
            toast.error((error as ApiError)?.data?.message || "Failed to add stock. Please try again.");
        }
    };

    const handleConfirmStock = async () => {
        if (!stockDatas?.batch_id) {
            toast.error("No valid batch ID available to confirm.");
            return;
        }

        try {
            const res = (await confirmStock(stockDatas.batch_id).unwrap()) as MutationResponse;
            toast.success(res.message || "Stock confirmed successfully!");
            await refetch();
            window.location.reload();
            setStockData(null);
        } catch (error) {
            console.error("Failed to confirm stock:", error);
            toast.error((error as ApiError)?.data?.message || "Failed to confirm stock. Please try again.");
        }
    };

    const handleCancelStock = async () => {
        if (!stockDatas?.batch_id) {
            toast.error("No valid batch ID available to cancel.");
            return;
        }

        try {
            const res = (await cancelStock(stockDatas.batch_id).unwrap()) as MutationResponse;
            toast.success(res.message || "Stock cancelled successfully!");
            await refetch();
            window.location.reload();
            setStockData(null);
        } catch (error) {
            console.error("Failed to cancel stock:", error);
            toast.error((error as ApiError)?.data?.message || "Failed to cancel stock. Please try again.");
        }
    };

    const handleRemoveProduct = async (item: StockBatchProduct) => {
        try {
            const result = await Swal.fire({
                title: "Are you sure?",
                text: `Do you want to delete the stock item for ${item.product}?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, delete item!",
            });

            if (result.isConfirmed) {
                const res = (await deleteBatch(item.id).unwrap()) as MutationResponse;
                toast.success(res.message || "Stock item deleted successfully!");
                await refetch();
                Swal.fire("Deleted!", "Stock item deleted successfully.", "success");
            }
        } catch (error) {
            console.error("Failed to delete stock item:", error);
        }
    };

    const money = (v: string | number) =>
        `৳${(Number(v) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const batchProducts = stockDatas?.products ?? [];
    const hasBatch = Boolean(stockDatas?.batch_id);

    const inputClass =
        "bg-[#23252b] border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-purple-500";

    return (
        <div className="px-4 py-8 text-white">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Stock Management</h1>
                    <p className="text-gray-300">Add stock to products and review the batch before confirming.</p>
                </div>
                {hasBatch && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <span className="text-sm text-gray-400">Batch ID</span>
                        <span className="text-sm font-semibold text-purple-300">{stockDatas?.batch_id}</span>
                    </div>
                )}
            </div>

            {/* Add Stock Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
                <h2 className="text-base font-semibold mb-4">Add Stock</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Search Product (with dropdown) */}
                    <div className="relative flex flex-col gap-1.5 sm:col-span-2 xl:col-span-2">
                        <Label htmlFor="search-product" className="text-xs text-gray-400 font-medium">Search Product</Label>
                        <Input
                            id="search-product"
                            className={inputClass}
                            placeholder="Search by name or generic…"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value) setSelectedProduct(null);
                            }}
                            autoComplete="off"
                        />
                        {searchResults?.data?.length && !selectedProduct ? (
                            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl z-30">
                                {searchResults.data.map((product) => (
                                    <button
                                        type="button"
                                        key={product.product_id}
                                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition"
                                        onClick={() => handleProductSelect(product)}
                                    >
                                        <span className="font-medium">{product.product_name}</span>
                                        <span className="text-gray-400"> ({product.generic_name})</span>
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Current Quantity (read-only) */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="current-quantity" className="text-xs text-gray-400 font-medium">Current Quantity</Label>
                        <Input
                            id="current-quantity"
                            className="bg-[#1a1c20] border-gray-700 text-gray-400"
                            placeholder="—"
                            value={stock}
                            disabled
                            readOnly
                        />
                    </div>

                    {/* Stock to add */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="stock-quantity" className="text-xs text-gray-400 font-medium">Add Quantity</Label>
                        <Input
                            id="stock-quantity"
                            type="number"
                            className={inputClass}
                            placeholder="0"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(Number(e.target.value) || 0)}
                        />
                    </div>

                    {/* Cost Price */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cost-price" className="text-xs text-gray-400 font-medium">Cost Price</Label>
                        <Input
                            id="cost-price"
                            className={inputClass}
                            placeholder="0.00"
                            value={costPrice}
                            onChange={(e) => setCostPrice(e.target.value)}
                        />
                    </div>

                    {/* MRP */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="mrp" className="text-xs text-gray-400 font-medium">MRP</Label>
                        <Input
                            id="mrp"
                            className={inputClass}
                            placeholder="0.00"
                            value={mrp}
                            onChange={(e) => setMrp(e.target.value)}
                        />
                    </div>

                    {/* Selling Price */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="selling-price" className="text-xs text-gray-400 font-medium">Selling Price</Label>
                        <Input
                            id="selling-price"
                            className={inputClass}
                            placeholder="0.00"
                            value={sellingPrice}
                            onChange={(e) => setSellingPrice(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                        onClick={handleAddStock}
                    >
                        Add Stock
                    </Button>
                </div>
            </div>

            {/* Current Batch Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-base font-semibold">Current Batch</h2>
                    <span className="text-sm text-gray-400">{batchProducts.length} item(s)</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-[#2c2e34]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Old Stock</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Added</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Cost Price</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">MRP</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Selling Price</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {batchProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                        No items in this batch yet. Add stock above to get started.
                                    </td>
                                </tr>
                            ) : (
                                batchProducts.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#2c2e34] transition">
                                        <td className="px-4 py-3 text-sm font-medium text-white">{item.product}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-300 tabular-nums">{item.old_stock ?? 0}</td>
                                        <td className="px-4 py-3 text-sm text-right text-green-400 font-semibold tabular-nums">+{item.stock}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-200 tabular-nums">{money(item.cost_price)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-400 tabular-nums">{money(item.mrp)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-white tabular-nums">{money(item.selling_price)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-white font-semibold tabular-nums">{money(item.total)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProduct(item)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-400 hover:bg-red-500/15 transition"
                                                aria-label="Remove item"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: total + actions */}
                <div className="px-5 py-4 border-t border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Total Value</span>
                        <span className="text-xl font-bold text-purple-300 tabular-nums">{money(stockDatas?.total_value || 0)}</span>
                    </div>
                    {hasBatch && (
                        <div className="flex gap-3">
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white px-6"
                                onClick={handleCancelStock}
                            >
                                Cancel Batch
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white px-6"
                                onClick={handleConfirmStock}
                            >
                                Confirm Add Product
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
