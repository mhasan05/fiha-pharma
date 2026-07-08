"use client";

import baseApi from "../Api/baseApi";

export const companiesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        allCompanies: builder.query({
            query: () => ({
                url: "/products/companies/",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),

            providesTags: ["Category"],
        }),

        addCompany: builder.mutation({
            query: (data) => ({
                url: "/products/companies/",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            invalidatesTags: ["Category"],
        }),
        updateCompany: builder.mutation({
            query: ({ id, data }) => ({
                url: `/products/companies/${id}/`, // Ensure ID is part of the URL
                method: "PATCH",
                body: data,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            invalidatesTags: ["Category"],
        }),

        deleteCompany: builder.mutation({
            query: ({ id }) => ({
                url: `/products/companies/${id}/`,
                method: "DELETE",
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

export const { useAllCompaniesQuery, useAddPostMutation, useDeleteCategoryMutation, useAddCompanyMutation, useUpdateCompanyMutation, useDeleteCompanyMutation } = companiesApi;
