"use client";

import { info } from "console";
import baseApi from "../Api/baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    userProfile: builder.query({
      query: () => ({
        url: "/auth/user_profile/",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),

      providesTags: ["User"],
    }),

    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/auth/user_profile/",
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/auth/user/${id}/`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    allUsers: builder.query({
      // Request a large page so the full customer list is returned (used by the
      // user section and the report customer filter). Backend max_page_size=1000.
      query: () => ({
        url: "/auth/user/?page_size=1000",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["User"],
    }),

    // Admin-only: create a staff/delivery account directly (POST /auth/user/).
    createUser: builder.mutation({
      query: (data) => ({
        url: "/auth/user/",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    settingData: builder.query({
      query: () => ({
        url: "/settings/site_info/",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
    }),

    updateSetting: builder.mutation({
      query: (data) => ({
        url: "/settings/site_info/",
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
    }),

    updateUsers: builder.mutation({
      query: ({data , id}) => ({
        url: `/auth/user/${id}/`,
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    // /settings/privacy-policy/
    privacyPolicy: builder.query({
      query: () => ({
        url: "/settings/privacy-policy/",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
    }),

    updatePrivacyPolicy: builder.mutation({
      query: ({data, id}) => ({
        url: `/settings/privacy-policy-detail/${id}/`,
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
    }),

    // /settings/terms-conditions/
    termsConditions: builder.query({
      query: () => ({
        url: "/settings/terms-conditions/",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["Terms"],
    }),

    createTermsConditions: builder.mutation({
      query: (data) => ({
        url: "/settings/terms-conditions/",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Terms"],
    }),

    updateTermsConditions: builder.mutation({
      query: ({ data, id }) => ({
        url: `/settings/terms-conditions-detail/${id}/`,
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["Terms"],
    }),

    // /settings/conditional-discounts/
    conditionalDiscounts: builder.query({
      query: () => ({
        url: "/settings/conditional-discounts/",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      providesTags: ["User"],
    }),

    // /settings/conditional-discounts-details/
    updateConditionalDiscounts: builder.mutation({
      query: (data) => ({
        url: `/settings/conditional-discounts-details/`,
        method: "PATCH",
        body: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

  }),
});

export const { useUserProfileQuery, useUpdateProfileMutation, useAllUsersQuery, useCreateUserMutation, useSettingDataQuery, useUpdateSettingMutation , useDeleteUserMutation, useUpdateUsersMutation , usePrivacyPolicyQuery , useUpdatePrivacyPolicyMutation , useTermsConditionsQuery , useCreateTermsConditionsMutation , useUpdateTermsConditionsMutation , useConditionalDiscountsQuery , useUpdateConditionalDiscountsMutation } = userApi;
