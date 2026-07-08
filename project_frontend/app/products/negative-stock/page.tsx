'use client';
import { useNegativeStockProductsQuery } from '@/redux/feature/notificationSlice';
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IMAGE_BASE_URL } from '@/lib/config';

interface Product {
  product_id: number;
  product_name: string;
  generic_name: string;
  product_description: string;
  product_image: string;
  sku: string;
  quantity_per_box: number;
  company_id: number;
  company_name: string;
  category_id: number[];
  category_name: string[];
  stock_quantity: number;
  cost_price: number;
  mrp: number;
  selling_price: number;
  discount_percent: number;
  out_of_stock: boolean;
  is_active: boolean;
  created_on: string;
  updated_on: string;
}

interface NegativeStockResponse {
  status: string;
  negative_product_count: number;
  active_negative_count: number;
  total_deficit_units: number;
  total_restock_cost: string;
  total_retail_value: string;
  total_selling_value: string;
  data: Product[];
}

export default function NegativeStock() {
  const { data: response, isLoading, error, refetch } =
    useNegativeStockProductsQuery(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const data: NegativeStockResponse | undefined = response;
  const products: Product[] = data?.data || [];

  const categories = ['all', ...new Set(products.flatMap((p) => p.category_name))];
  const companies = ['all', ...new Set(products.map((p) => p.company_name))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || product.category_name.includes(filterCategory);
    const matchesCompany =
      filterCompany === 'all' || product.company_name === filterCompany;
    return matchesSearch && matchesCategory && matchesCompany;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Totals across ALL filtered products (not just the current page)
  const totalStockQty = filteredProducts.reduce((s, p) => s + (Number(p.stock_quantity) || 0), 0);
  const totalRestockCost = filteredProducts.reduce(
    (s, p) => s + Math.abs(p.stock_quantity) * (Number(p.cost_price) || 0),
    0
  );

  const fmt = (v: string | number) =>
    new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(v) || 0);

  const handleDownloadPDF = () => {
    // Export every filtered product (all pages), not just the current page.
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const generatedAt = new Date().toLocaleString();

    doc.setFontSize(16);
    doc.text('Negative Stock Products', 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Generated: ${generatedAt}`, 40, 58);
    doc.text(`Total products: ${filteredProducts.length}`, 40, 72);
    doc.text(`Total stock qty: ${totalStockQty}`, 40, 86);

    let totalRestockCostPdf = 0;
    let totalStockQtyPdf = 0;
    const body = filteredProducts.map((p, i) => {
      const deficit = Math.abs(p.stock_quantity);
      const restockCost = deficit * (Number(p.cost_price) || 0);
      totalRestockCostPdf += restockCost;
      totalStockQtyPdf += Number(p.stock_quantity) || 0;
      return [
        i + 1,
        p.product_name,
        p.sku,
        p.category_name.join(', '),
        p.company_name,
        p.stock_quantity,
        fmt(p.cost_price),
        fmt(p.mrp),
        fmt(p.selling_price),
        fmt(restockCost),
      ];
    });

    autoTable(doc, {
      startY: 100,
      head: [[
        '#', 'Product', 'SKU', 'Category', 'Company', 'Stock Qty',
        'Cost Price', 'MRP', 'Selling Price', 'Restock Cost',
      ]],
      body,
      foot: [[
        { content: 'Total', colSpan: 5, styles: { halign: 'right' } },
        { content: String(totalStockQtyPdf), styles: { halign: 'right' } },
        { content: '', colSpan: 3 },
        fmt(totalRestockCostPdf),
      ]],
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [26, 58, 82], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'right', cellWidth: 24 },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
      },
    });

    doc.save(`negative_stock_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#2c2e34]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#2c2e34]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-4 rounded-lg shadow-md max-w-md">
          <h3 className="font-semibold mb-2">Error Loading Negative Stock Products</h3>
          <p>Failed to load data. Please try again later.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="px-4 py-8 ">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Negative Stock Products</h1>
            <p className="text-gray-300">
              Products with stock below zero — requires urgent restock or audit
            </p>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={filteredProducts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-red-500">
            <p className="text-sm text-gray-400">Total Negative Products</p>
            <p className="text-2xl font-bold text-red-400">
              {data?.negative_product_count ?? 0}
            </p>
          </div>
          <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-amber-500">
            <p className="text-sm text-gray-400">Total Deficit Units</p>
            <p className="text-2xl font-bold text-amber-400">
              {fmt(data?.total_deficit_units ?? 0)}
            </p>
          </div>
          <div className="bg-[#3a3c44] p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-sm text-gray-400">Restock Cost (Buying)</p>
            <p className="text-2xl font-bold text-purple-400">
              ৳{fmt(data?.total_restock_cost ?? 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, generic name or SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 pl-10 bg-[#3a3c44] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-[#3a3c44] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>

          <select
            value={filterCompany}
            onChange={(e) => {
              setFilterCompany(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-[#3a3c44] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {companies.map((company) => (
              <option key={company} value={company}>
                {company === 'all' ? 'All Companies' : company}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#2c2e34]">
                <tr>
                  <th className="px-3 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-3 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Stock Qty
                  </th>
                  <th className="px-3 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-3 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    MRP
                  </th>
                  <th className="px-3 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-3 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Restock Cost
                  </th>
                  <th className="px-3 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentProducts.map((product) => {
                  const deficit = Math.abs(product.stock_quantity);
                  const restockCost =
                    deficit * (Number(product.cost_price) || 0);
                  return (
                    <tr
                      key={product.product_id}
                      className="hover:bg-[#2c2e34] transition"
                    >
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={`${IMAGE_BASE_URL}${product.product_image}`}
                              alt={product.product_name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  '/placeholder-image.jpg';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {product.product_name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {product.generic_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{product.sku}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {product.category_name.join(', ')}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {product.company_name}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-red-400 tabular-nums">
                          {product.stock_quantity}
                        </div>
                        <div className="text-xs text-gray-500">
                          deficit: {deficit}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-200 tabular-nums">
                          ৳{fmt(product.cost_price)}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-400 tabular-nums line-through">
                          ৳{fmt(product.mrp)}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-white tabular-nums">
                          ৳{fmt(product.selling_price)}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-purple-400 tabular-nums">
                          ৳{fmt(restockCost)}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-red-400 capitalize">
                          {product.is_active ? 'Negative' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredProducts.length > 0 && (
                <tfoot className="bg-[#2c2e34] border-t-2 border-gray-600">
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-right text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Total
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-red-400 tabular-nums">
                      {totalStockQty.toLocaleString()}
                    </td>
                    <td colSpan={3}></td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-purple-400 tabular-nums">
                      ৳{fmt(totalRestockCost)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {products.length === 0
                  ? 'No products with negative stock'
                  : 'No products match your filters'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 py-4 bg-[#2c2e34] border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1} to{' '}
                {Math.min(endIndex, filteredProducts.length)} of{' '}
                {filteredProducts.length} products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-purple-600 text-white rounded">
                  {currentPage}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-[#3a3c44] text-white rounded hover:bg-[#4a4c54] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
