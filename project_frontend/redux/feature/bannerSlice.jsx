"use client";

import baseApi from "../Api/baseApi";

export const bannerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    bannerList: builder.query({
      query: () => ({
        url: "/products/banners/",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),

      providesTags: ["Banner"],
    }),

    createBanner: builder.mutation({
      query: (data) => ({
        url: "/products/banners/",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Banner"],
    }),

    deleteBanner: builder.mutation({
      query: (id) => ({
        url: `/products/banners/${id}/`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Banner"],
    }),

    updateBanner: builder.mutation({
      query: ({ id, data }) => ({
        url: `/products/banners/${id}/`,
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Banner"],
    }),

  }),
});

export const { useBannerListQuery, useCreateBannerMutation, useDeleteBannerMutation , useUpdateBannerMutation } = bannerApi;