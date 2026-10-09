// Shared form rules

// Mirrors the backend rules in validators.js
export const passwordIssues = (password) => {
  const issues = [];
  if (password.length < 8) issues.push('at least 8 characters');
  if (!/[A-Za-z]/.test(password)) issues.push('a letter');
  if (!/[0-9]/.test(password)) issues.push('a number');
  return issues;
};
