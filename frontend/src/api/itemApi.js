import api from './client.js';

const toFormData = (data, images = []) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => form.append(key, v));
    else if (value !== undefined && value !== null) form.append(key, value);
  });
  images.forEach((file) => form.append('images', file));
  return form;
};

export const getMeta = async () => (await api.get('/meta')).data;

// params: { q, type, category, status, sort, page, limit } -> { items, total, page, pages }
export const getAllItems = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return (await api.get('/items', { params: clean })).data;
};

export const getItem = async (itemId) => (await api.get(`/items/${itemId}`)).data;

export const getItemMatches = async (itemId) => (await api.get(`/items/${itemId}/matches`)).data;

export const getUserItems = async () => (await api.get('/user/items')).data;

export const getUserClaims = async () => (await api.get('/user/claims')).data;

export const addItemAPI = async (itemData, images = []) =>
  (await api.post('/items', toFormData(itemData, images))).data;

export const updateItemAPI = async (itemId, itemData, images = []) =>
  (await api.patch(`/items/${itemId}`, toFormData(itemData, images))).data;

export const updateItemStatus = async (itemId, status) =>
  (await api.patch(`/items/${itemId}`, { status })).data;

export const deleteItemById = async (itemId) => (await api.delete(`/items/${itemId}`)).data;

export const claimItemRequest = async (itemId, message) =>
  (await api.post(`/items/${itemId}/claim-request`, { message })).data;

export const fetchAdminStats = async () => (await api.get('/admin/stats')).data;

export const fetchAdminClaimRequests = async (status) =>
  (await api.get('/admin/claim-requests', { params: status ? { status } : {} })).data;

export const handleAdminClaimRequest = async (claimRequestId, action) =>
  (await api.post(`/admin/claim-requests/${claimRequestId}`, { action })).data;

export const deleteClaimRequest = async (claimRequestId) =>
  (await api.delete(`/admin/claim-requests/${claimRequestId}`)).data;
