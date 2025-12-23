const prefix = "/api";

export const endpoints = {
  auth: {
    sign_in: `/auth/public/login`,
    // profile/me endpoint
    auth_me: `/profile/protected/api/v1/me`,
    sign_out: `${prefix}/auth/sign-out`,
    sign_up: `${prefix}/auth/sign-up`,
    // Register with role
    register: (role_name) => `/auth/public/register?role_name=${role_name}`,
  },
  user: {
    find: `${prefix}/users`,
    find_one: (id) => `${prefix}/users/${id}`,
    create: `${prefix}/users`,
    update: (id) => `${prefix}/users/${id}`,
    delete: (id) => `${prefix}/users/${id}`,
  },
  policy: {
    data_tier: {
      category: {
        get_all: "/policy/protected/api/v2/data-tier-categories/",
        get_one: (category_id) =>
          `/policy/protected/api/v2/data-tier-categories/${category_id}`,
      },
      tier: {
        get_by_category: (category_id) =>
          `/policy/protected/api/v2/data-tiers/category/${category_id}`,
        get_data_sources: (tier_id) =>
          `/policy/protected/api/v2/data-sources/tier/${tier_id}`,
      },
    },
    base_policy: {
      create_complete: (expiration_hours = 24) =>
        `/policy/protected/api/v2/base-policies/complete?expiration_hours=${expiration_hours}`, // ✅ Changed from v1 to v2
      get_by_provider: `/policy/protected/api/v2/base-policies/by-provider`,
      get_draft_filter: (provider_id) =>
        `/policy/protected/api/v2/base-policies/draft/filter?provider_id=${provider_id}`,
      get_draft_detail_by_id: (
        base_policy_id,
        archive_status = false,
        provider_id = null
      ) => {
        let url = `/policy/protected/api/v2/base-policies/draft/filter?archive_status=${archive_status}&base_policy_id=${base_policy_id}`;
        if (provider_id) {
          url += `&provider_id=${provider_id}`;
        }
        return url;
      },
      get_detail: (id, options = {}) => {
        const {
          provider_id,
          include_pdf = true,
          pdf_expiry_hours = 1,
        } = options;
        const params = new URLSearchParams({
          id,
          include_pdf: include_pdf.toString(),
          pdf_expiry_hours: pdf_expiry_hours.toString(),
        });
        if (provider_id) params.append("provider_id", provider_id);
        return `/policy/protected/api/v2/base-policies/detail?${params.toString()}`;
      },
      get_count: `/policy/protected/api/v2/base-policies/count`,
      get_count_by_status: (status) =>
        `/policy/protected/api/v2/base-policies/count/status/${status}`,
      cancel: (id, keepRegisteredPolicy = true) =>
        `/policy/protected/api/v2/base-policies/cancel/${id}?keep_registered_policy=${keepRegisteredPolicy}`,
    },
    policy: {
      list: "/policy/protected/api/v2/policies/read-partner/list",
      detail: (id) =>
        `/policy/protected/api/v2/policies/read-partner/detail/${id}`,
      underwriting: (policy_id) =>
        `/policy/protected/api/v2/policies/create-partner/underwriting/${policy_id}`,
    },
  },
  applications: {
    list: "/policy/protected/api/v2/farms",
    detail: (id) => `/policy/protected/api/v2/farms/${id}`,
    list_by_owner: "/policy/protected/api/v2/farms/me",
    create: "/policy/protected/api/v2/farms",
    update: (id) => `/policy/protected/api/v2/farms/${id}`,
    delete: (id) => `/policy/protected/api/v2/farms/${id}`,
  },
  profile: {
    // Partner public profile
    get_partner: (partner_id) =>
      `/profile/public/api/v1/insurance-partners/${partner_id}`,
    // Account/profile for current authenticated user (protected)
    me: `/profile/protected/api/v1/me`,
    // Update user profile (account info)
    update_user: `/profile/protected/api/v1/users`,
    // Update partner/company profile for current admin
    update_partner_me: `/profile/protected/api/v1/insurance-partners/me/profile`,
    // Get bank info for users
    bank_info: `/profile/protected/api/v1/users/bank-info`,
    // Public: get user by public user id (own endpoint)
    get_public_user_by_id: (user_id) =>
      `/profile/public/api/v1/users/own/${user_id}`,
    // Admin update user (assign partner_id to employee)
    admin_update_user: (user_id) =>
      `/profile/protected/api/v1/users/admin/${user_id}`,
    // Partner deletion requests
    deletion_request: {
      create: `/profile/protected/api/v1/insurance-partners/deletion-requests`,
      get_by_admin: (partner_admin_id) =>
        `/profile/protected/api/v1/insurance-partners/${partner_admin_id}/deletion-requests`,
      revoke: `/profile/protected/api/v1/insurance-partners/deletion-requests/revoke`,
    },
  },
  riskAnalysis: {
    by_policy: (policy_id) =>
      `/policy/protected/api/v2/risk-analysis/read-partner/by-policy/${policy_id}`,
    create: `/policy/protected/api/v2/risk-analysis/create`,
  },
  monitoring: {
    data: (farm_id, parameter_name) =>
      `/policy/protected/api/v2/policies/read-partner/monitoring-data/${farm_id}/${parameter_name}`,
  },
  dataSources: {
    detail: (data_source_id) =>
      `/policy/protected/api/v2/data-sources/${data_source_id}`,
  },
  claim: {
    list: "/policy/protected/api/v2/claims/read-partner/list",
    detail: (id) => `/policy/protected/api/v2/claims/read-partner/detail/${id}`,
    byPolicy: (policy_id) =>
      `/policy/protected/api/v2/claims/read-partner/by-policy/${policy_id}`,
    validate: (claim_id) =>
      `/policy/protected/api/v2/claims/write/validate/${claim_id}`,
    createRejection: "/policy/protected/api/v2/claim-rejections/create-partner",
    rejectionList:
      "/policy/protected/api/v2/claim-rejections/read-partner/list",
    rejectionByClaim: (claim_id) =>
      `/policy/protected/api/v2/claim-rejections/read-partner/claim/${claim_id}`,
  },
  payout: {
    detail: (id) =>
      `/policy/protected/api/v2/payouts/read-partner/detail/${id}`,
    byPolicy: (policy_id) =>
      `/policy/protected/api/v2/payouts/read-partner/by-policy/${policy_id}`,
    byFarm: (farm_id) =>
      `/policy/protected/api/v2/payouts/read-partner/by-farm/${farm_id}`,
    list: "/policy/protected/api/v2/payouts/read-partner/list",
  },
  payment: {
    createPayout: "/payment/protected/payout",
    verifyPayout: "/payment/public/payout/verify",
    listPayout: "/payment/protected/payout",
    bulkVerifyPayout: "/payment/public/payout/verify/bulk",
  },
  cancelRequest: {
    create: `/policy/protected/api/v2/cancel_request/`,
    listPartner: "/policy/protected/api/v2/cancel_request/read-partner/own",
    review: (id) => `/policy/protected/api/v2/cancel_request/review/${id}`,
    revoke: (id) => `/policy/protected/api/v2/cancel_request/revoke/${id}`,
    resolveDispute: (id) =>
      `/policy/protected/api/v2/cancel_request/resolve-dispute/${id}`,
  },
  dashboard: {
    partnerOverview: "/policy/protected/api/v2/dashboard/partner/overview",
  },
  imgbb: {
    // Template for ImgBB upload URL. Provide API key when using.
    upload: (apiKey) => `https://api.imgbb.com/1/upload?key=${apiKey}`,
  },
  noti: {
    subscribe: "/noti/protected/subscribe/web",
    unsubscribe: "/noti/protected/unsubscribe/web",
    validate: `/noti/protected/validate?platform=web`,
    pagination: (page, limit) =>
      `/noti/protected/notifications?page=${page}&limit=${limit}&platform=web`,
    mark_as_read: `/noti/protected/mark-read`,
  },
};
