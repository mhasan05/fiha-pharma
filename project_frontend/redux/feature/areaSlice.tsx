"use client";

import baseApi from "../Api/baseApi";

export const areaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    areaList: builder.query({
      query: () => ({
        url: "/auth/area/",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),

      providesTags: ["Area"],
    }),

    addArea: builder.mutation({
      query: (data) => ({
        url: "/auth/area/",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Area"],
    }),
    updateArea: builder.mutation({
      query: ({ id, data }) => ({
        url: `/auth/area/${id}/`, // Ensure ID is part of the URL
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Area"],
    }),
    deleteArea: builder.mutation({
      query: (id) => ({
        url: `/auth/area/${id}/`, // Ensure ID is part of the URL
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Area"],
    }),
  }),
});

export const { useAreaListQuery, useAddAreaMutation, useUpdateAreaMutation , useDeleteAreaMutation} =
  areaApi;
