const defaultApiBaseUrl = "http://127.0.0.1:9081/api/v1";

export const config = {
  get apiBaseUrl() {
    return import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;
  },
  get organizationId() {
    return Number(import.meta.env.VITE_ORGANIZATION_ID ?? "1");
  },
  get useMock() {
    return import.meta.env.VITE_ENABLE_MOCK === "true";
  },
};
