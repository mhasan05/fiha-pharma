"use client";

import baseApi from "../Api/baseApi";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    allProducts: builder.query({
      query: ({ limit, page , src }) => ({
        url: `/products/products/?limit=${limit}&page=${page}&src=${src}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),

      providesTags: ["User"],
    }),

    addPost: builder.mutation({
      query: (data) => ({
        url: "/products/products/",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/products/${id}/`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    updateProduct: builder.mutation({
      query: ({ id, data }) => ({
        url: `/products/products/${id}/`,
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    singleProduct: builder.query({
      query: (id) => ({
        url: `/products/products/${id}/`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["User"],
    }),

    searchProducts: builder.query({
      query: (searchTerm) => ({
        // /products/products?src=napa
        url: `/products/products/search/?q=${searchTerm}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["User"],
    }),

  }),
});

export const { useAllProductsQuery, useAddPostMutation, useDeleteProductMutation, useUpdateProductMutation, useSingleProductQuery , useSearchProductsQuery } = productsApi;
