import api from './axois.js'; 


const safeExtractItems = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
};

export const getUserItems = async () => {
  const res = await api.get('/user/items');
  return safeExtractItems(res);
};

export const getAllItems = async () => {
  const res = await api.get('/items');
  return safeExtractItems(res);
};


export const updateItemStatus = async (itemId, email, newStatus) => {
  const res = await api.put(`/update/${itemId}`, {
    email,
    status: newStatus,
  });
  return res.data;
};


export const addItemAPI = async (itemData) => {
  const res = await api.post('/add', itemData);
  return res.data;
};


export const claimItemRequest = async (itemId) => {
  const res = await api.post(`/items/${itemId}/claim-request`);
  return res.data;
};


export const fetchAdminClaimRequests = async () => {
  const res = await api.get('/admin/claim-requests');
  return res.data;
};

export const handleAdminClaimRequest = async (claimRequestId, action) => {
  const res = await api.post(`/admin/claim-requests/${claimRequestId}`, { action });
  return res.data;
};

export const deleteItemById = async (itemId) => {
  const response = await api.delete(`/delete/${itemId}`);
  return response.data;
};

export const deleteClaimRequest = async (claimRequestId) => {
  const response = await fetch(`/api/admin/claims/${claimRequestId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete claim request');
  }
  return await response.json();
};
