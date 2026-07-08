"use client";

import { create } from "domain";
import baseApi from "../Api/baseApi";

export const categoriesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        allCategories: builder.query({
            query: () => ({
                url: "/products/categories/",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),

            providesTags: ["Category"],
        }),

        createCategory: builder.mutation({
            query: (data) => ({
                url: "/products/categories/",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            invalidatesTags: ["Category"],
        }),

        updateCategory: builder.mutation({
            query: ({ id, data }) => ({
                url: `/products/categories/${id}/`, // Ensure ID is part of the URL
                method: "PATCH",
                body: data,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            invalidatesTags: ["Category"],
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
            invalidatesTags: ["Category"],
        }),

        deleteCategory: builder.mutation({
            query: ({ id }) => ({
                url: `/products/categories/${id}/`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
        }),

    }),
});

export const { useAllCategoriesQuery, useAddPostMutation, useDeleteCategoryMutation, useCreateCategoryMutation, useUpdateCategoryMutation } = categoriesApi;
