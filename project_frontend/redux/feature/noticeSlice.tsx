"use client";

import { create } from "domain";
import baseApi from "../Api/baseApi";

export const noticeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        allNotices: builder.query({
            query: () => ({
                url: "/announcement/notices/",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),

            providesTags: ["Notice"],
        }),

        updateNotice: builder.mutation({
            query: ({ id, data }) => ({
                url: `/announcement/notices/${id}/`,
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: data,
            }),
            invalidatesTags: ["Notice"],
        }),
        deleteNotice: builder.mutation({
            query: (id) => ({
                url: `/announcement/notices/${id}/`,
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            }),
            invalidatesTags: ["Notice"],
        }),
        createNotice: builder.mutation({
            query: (data) => ({
                url: "/announcement/notices/",
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: data,
            }),
            invalidatesTags: ["Notice"],
        }),
      

    }),
});

export const { useAllNoticesQuery , useUpdateNoticeMutation, useDeleteNoticeMutation, useCreateNoticeMutation } = noticeApi;
