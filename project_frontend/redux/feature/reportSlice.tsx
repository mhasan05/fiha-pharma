"use client";

import baseApi from "../Api/baseApi";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /reports/ -> list of available reports (name, title, description)
    reportIndex: builder.query({
      query: () => ({
        url: "/reports/",
        method: "GET",
        headers: authHeader(),
      }),
    }),

    productWiseReport: builder.query({
      query: () => ({
        url: "/reports/product_wise/",
        method: "GET",
        headers: authHeader(),
      }),
      providesTags: ["User"],
    }),

    orderReport: builder.query({
      query: (params?: {
        from_datetime?: string;
        to_datetime?: string;
        customer?: string | number;
        area?: string | number;
      }) => {
        const search = new URLSearchParams();
        if (params?.from_datetime) search.append("from_datetime", params.from_datetime);
        if (params?.to_datetime) search.append("to_datetime", params.to_datetime);
        if (params?.customer && params.customer !== "all")
          search.append("customer", String(params.customer));
        if (params?.area && params.area !== "all")
          search.append("area", String(params.area));
        const qs = search.toString();
        return {
          url: `/reports/order/${qs ? `?${qs}` : ""}`,
          method: "GET",
          headers: authHeader(),
        };
      },
      providesTags: ["User"],
    }),
  }),
});

export const {
  useReportIndexQuery,
  useProductWiseReportQuery,
  useOrderReportQuery,
} = reportApi;
