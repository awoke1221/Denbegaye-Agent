// Stub implementations for removed backend functions
// These should be replaced with calls to the workers service

export const getUserUsage = async (userId: string) => {
  // TODO: Call workers service
  return {
    requests: { current: 0, limit: 1000, percentage: 0 },
    tokens: { current: 0, limit: 100000, percentage: 0 },
  };
};

export const getUserLimits = async (userId: string) => {
  // TODO: Call workers service
  return {
    requests: { current: 1000, limit: 1000, percentage: 100 },
    tokens: { current: 100000, limit: 100000, percentage: 100 },
  };
};
