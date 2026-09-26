type AccountManagementListener = () => void;

const listeners = new Set<AccountManagementListener>();

export const requestAccountManagement = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeAccountManagementRequests = (listener: AccountManagementListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
