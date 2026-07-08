"use client";

import baseApi from "../Api/baseApi";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    allNotifications: builder.query({
      query: () => ({
        url: `/user/admin_notifications/`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),

      providesTags: ["Notification"],
    }),

    makeasRead: builder.mutation({
      query: (id) => ({
        // /user/admin_notifications/mark_as_read/1/
        url: `/user/admin_notifications/mark_as_read/${id}/`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Notification"],
    }),

    makeasAllRead: builder.mutation({
      query: () => ({
        url: `/user/admin_notifications/mark_all_as_read/`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Notification"],
    }),

    // /products/products/low_stock/count/
    lowStockCount: builder.query({
      query: () => ({
        url: `/products/products/low_stock/count/`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
    }),

    // /products/products/negative_stock/
    negativeStockProducts: builder.query({
      query: () => ({
        url: `/products/products/negative_stock/`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
    }),

  }),
});

export const { useAllNotificationsQuery, useMakeasReadMutation, useMakeasAllReadMutation, useLowStockCountQuery, useNegativeStockProductsQuery } = notificationsApi;
