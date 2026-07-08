"use client";

import baseApi from "../Api/baseApi";

export const appReleaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: list every uploaded release
    appReleases: builder.query({
      query: () => ({ url: "/settings/app-releases/", method: "GET" }),
      providesTags: ["AppRelease"],
    }),

    // Admin: upload a new release (multipart FormData with the apk file)
    createAppRelease: builder.mutation({
      query: (formData: FormData) => ({
        url: "/settings/app-releases/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["AppRelease"],
    }),

    // Admin: toggle availability / force-update, edit notes, etc.
    updateAppRelease: builder.mutation({
      query: ({ id, data }: { id: number; data: Record<string, unknown> }) => ({
        url: `/settings/app-releases/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["AppRelease"],
    }),

    deleteAppRelease: builder.mutation({
      query: (id: number) => ({
        url: `/settings/app-releases/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["AppRelease"],
    }),
  }),
});

export const {
  useAppReleasesQuery,
  useCreateAppReleaseMutation,
  useUpdateAppReleaseMutation,
  useDeleteAppReleaseMutation,
} = appReleaseApi;
