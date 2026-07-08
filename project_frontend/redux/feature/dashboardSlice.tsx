"use client";

import baseApi from "../Api/baseApi";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    allDashboard: builder.query({
      query: (params?: { from_datetime?: string; to_datetime?: string }) => {
        const search = new URLSearchParams();
        if (params?.from_datetime) search.append("from_datetime", params.from_datetime);
        if (params?.to_datetime) search.append("to_datetime", params.to_datetime);
        const qs = search.toString();
        return {
          url: `/dashboard/dashboard_info/${qs ? `?${qs}` : ""}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        };
      },
      providesTags: ["User"],
    }),

  }),
});

export const { useAllDashboardQuery } = dashboardApi;
