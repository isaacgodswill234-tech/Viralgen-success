
import React from 'react';

// For this free version, we assume the user has a standard API key 
// and doesn't need the specialized Veo billing check.
const ApiKeyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default ApiKeyGuard;
