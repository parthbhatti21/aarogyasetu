import React, { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  showMobileSidebar: boolean;
  setShowMobileSidebar: (show: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <LayoutContext.Provider value={{ showMobileSidebar, setShowMobileSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
};
