export const getAuthHeader = () => {
  const session = JSON.parse(localStorage.getItem('user'));
  return session?.accessToken
    ? { headers: { Authorization: `Bearer ${session.accessToken}` } }
    : {};
};

export const updateAccessToken = (newToken) => {
  const session = JSON.parse(localStorage.getItem('user'));
  if (!session) return;
  const updatedSession = { ...session, accessToken: newToken };
  localStorage.setItem('user', JSON.stringify(updatedSession));
};

export const logoutUser = () => {
  localStorage.removeItem('user');
  window.location.href = '/login';
};
