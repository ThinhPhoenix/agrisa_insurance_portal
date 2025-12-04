const prefix = "/api";

export const endpoints = {
  auth: {
    sign_in: `/auth/public/login`,
    // profile/me endpoint
    auth_me: `/profile/protected/api/v1/me`,
    sign_out: `${prefix}/auth/sign-out`,
    sign_up: `${prefix}/auth/sign-up`,
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
    get_partner: (partner_id) =>
      `/profile/public/api/v1/insurance-partners/${partner_id}`,
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
};
