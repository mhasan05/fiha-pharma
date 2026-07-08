import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/config";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["User", "Session", "Area", "Blog", "Product",'Order','Category', 'Notice', 'Notification', 'Banner' , 'Stock', 'Deposit', 'AppRelease', 'Terms'],
  endpoints: () => ({}),
});

export default baseApi;
