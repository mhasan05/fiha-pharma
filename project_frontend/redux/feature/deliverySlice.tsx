"use client";

import baseApi from "../Api/baseApi";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export const deliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: list deposit requests (filter by status / delivery_man)
    adminDeposits: builder.query({
      query: (params?: { status?: string; delivery_man?: string | number; page?: number }) => {
        const search = new URLSearchParams();
        if (params?.status && params.status !== "all") search.append("status", params.status);
        if (params?.delivery_man) search.append("delivery_man", String(params.delivery_man));
        if (params?.page) search.append("page", String(params.page));
        const qs = search.toString();
        return {
          url: `/delivery/admin/deposits/${qs ? `?${qs}` : ""}`,
          method: "GET",
          headers: authHeader(),
        };
      },
      providesTags: ["Deposit"],
    }),

    // Admin: approve a deposit
    approveDeposit: builder.mutation({
      query: (id: number) => ({
        url: `/delivery/admin/deposits/${id}/approve/`,
        method: "POST",
        headers: authHeader(),
      }),
      invalidatesTags: ["Deposit"],
    }),

    // Admin: reject a deposit (optional note)
    rejectDeposit: builder.mutation({
      query: ({ id, note }: { id: number; note?: string }) => ({
        url: `/delivery/admin/deposits/${id}/reject/`,
        method: "POST",
        body: { note: note || "" },
        headers: authHeader(),
      }),
      invalidatesTags: ["Deposit"],
    }),

    // Admin dashboard-sync reports (collection_summary / returns_summary /
    // due_summary / delivery_performance)
    deliveryReport: builder.query({
      query: ({ name, from, to }: { name: string; from?: string; to?: string }) => {
        const search = new URLSearchParams();
        if (from) search.append("from_datetime", from);
        if (to) search.append("to_datetime", to);
        const qs = search.toString();
        return {
          url: `/reports/${name}/${qs ? `?${qs}` : ""}`,
          method: "GET",
          headers: authHeader(),
        };
      },
      providesTags: ["Deposit"],
    }),

    // Admin: delivery agents (with area + current load)
    deliveryAgents: builder.query({
      query: () => ({
        url: `/delivery/admin/agents/`,
        method: "GET",
        headers: authHeader(),
      }),
      providesTags: ["Order"],
    }),

    // Admin: orders for the assignment screen
    assignableOrders: builder.query({
      query: (params?: { assigned?: string; status?: string; area?: string; page?: number }) => {
        const search = new URLSearchParams();
        if (params?.assigned && params.assigned !== "all") search.append("assigned", params.assigned);
        if (params?.status) search.append("status", params.status);
        if (params?.area && params.area !== "all") search.append("area", String(params.area));
        if (params?.page) search.append("page", String(params.page));
        const qs = search.toString();
        return {
          url: `/delivery/admin/orders/${qs ? `?${qs}` : ""}`,
          method: "GET",
          headers: authHeader(),
        };
      },
      providesTags: ["Order"],
    }),

    // Admin: (re)assign an order to an agent
    assignOrder: builder.mutation({
      query: ({ id, delivery_man }: { id: number; delivery_man: number }) => ({
        url: `/delivery/admin/orders/${id}/assign/`,
        method: "POST",
        body: { delivery_man },
        headers: authHeader(),
      }),
      invalidatesTags: ["Order"],
    }),

    // Admin: return-request review queue
    adminReturnRequests: builder.query({
      query: (params?: { status?: string; delivery_man?: string | number; page?: number }) => {
        const search = new URLSearchParams();
        if (params?.status && params.status !== "all") search.append("status", params.status);
        if (params?.delivery_man) search.append("delivery_man", String(params.delivery_man));
        if (params?.page) search.append("page", String(params.page));
        const qs = search.toString();
        return {
          url: `/delivery/admin/return-requests/${qs ? `?${qs}` : ""}`,
          method: "GET",
          headers: authHeader(),
        };
      },
      providesTags: ["Order"],
    }),

    // Admin: confirm (restores stock + adjusts order) / reject a return request
    reviewReturnRequest: builder.mutation({
      query: ({ id, action, note }: { id: number; action: "confirm" | "reject"; note?: string }) => ({
        url: `/delivery/admin/return-requests/${id}/${action}/`,
        method: "POST",
        body: { note: note || "" },
        headers: authHeader(),
      }),
      invalidatesTags: ["Order", "Product"],
    }),
  }),
});

export const {
  useAdminDepositsQuery,
  useApproveDepositMutation,
  useRejectDepositMutation,
  useDeliveryReportQuery,
  useDeliveryAgentsQuery,
  useAssignableOrdersQuery,
  useAssignOrderMutation,
  useAdminReturnRequestsQuery,
  useReviewReturnRequestMutation,
} = deliveryApi;
