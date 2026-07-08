"use client";

import { create } from "domain";
import baseApi from "../Api/baseApi";

export const genericApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    allGenerics: builder.query({
      query: () => ({
        url: "/products/generic_name/",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["User"],
    }),

    createGeneric: builder.mutation({
      query: (data) => ({
        url: "/products/generic_name/",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    updateGeneric: builder.mutation({
      query: ({ id, data }) => ({
        url: `/products/generic_name/${id}/`, // Ensure ID is part of the URL
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    deleteGeneric: builder.mutation({
      query: (id) => ({
        url: `/products/generic_name/${id}/`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),


    
  }),
});

export const { useAllGenericsQuery , useCreateGenericMutation , useUpdateGenericMutation , useDeleteGenericMutation } = genericApi;
