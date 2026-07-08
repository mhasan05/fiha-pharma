"use client";

import baseApi from "../Api/baseApi";

export const stockApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({


        allStockProducts: builder.query({
            query: () => ({
                url: "/products/products/",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
        }),

        createStock: builder.mutation({
            query: (stockData) => ({
                url: "/products/batch/add/",
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: stockData,
            }),
            invalidatesTags: ["User"],
        }),

        stockData: builder.query({
            query: (id) => ({
                url: `/products/batch/${id}/summary/`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            providesTags: ["Stock"],
        }),

        confirmStock: builder.mutation({
            query: (id) => ({
                url: `/products/batch/${id}/confirm/`,
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            invalidatesTags: ["Stock"],
        }),

        cancelStock: builder.mutation({
            query: (id) => ({
                url: `/products/batch/${id}/cancel/`,
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            invalidatesTags: ["Stock"],
        }),
        // /products/products/search/?q=napa
        searchProduct: builder.query({
            query: (query) => ({
                url: `/products/products/search/?q=${query}`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            providesTags: ["User"],
        }),

        batchIdSearch: builder.query({
            query: (id) => ({
                url: `/products/batch/${id}/get_summary/`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            providesTags: ["Stock"],
        }),

        batchIdSearchapi: builder.query({
            query: ({
                q = '',
                start_date = '',
                end_date = '',
            }: { q?: string; start_date?: string; end_date?: string }) => {
                const params = new URLSearchParams();
                if (q) params.append('q', q);
                if (start_date) params.append('start_date', start_date);
                if (end_date) params.append('end_date', end_date);
                return {
                    // /products/batches/search/?q=bat&start_date=2025-09-01&end_date=2026-03-10
                    url: `/products/batches/search/?${params.toString()}`,
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                };
            },
            providesTags: ["Stock"],
        }),

        batchDateRangeSearch: builder.query({
            query: ({ q = '', start_date = '', end_date = '' }: { q?: string; start_date?: string; end_date?: string }) => {
                const params = new URLSearchParams();
                if (q) params.append('q', q);
                if (start_date) params.append('start_date', start_date);
                if (end_date) params.append('end_date', end_date);
                return {
                    url: `/products/batches/search/?${params.toString()}`,
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                };
            },
            providesTags: ["Stock"],
        }),
        deleteBatch: builder.mutation({
            query: (id) => ({
                // /products/batch/delete/71/
                url: `/products/batch/delete/${id}/`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            invalidatesTags: ["Stock"],
        }),


    }),
});

export const { useAllStockProductsQuery, useCreateStockMutation, useStockDataQuery, useConfirmStockMutation, useCancelStockMutation, useSearchProductQuery, useBatchIdSearchQuery, useBatchIdSearchapiQuery, useDeleteBatchMutation, useBatchDateRangeSearchQuery } = stockApi;
