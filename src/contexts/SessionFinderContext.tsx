import { createContext, useContext, useState, ReactNode } from "react";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const SessionFinderContext = createContext<Ctx>({ open: false, setOpen: () => {} });

export function SessionFinderProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SessionFinderContext.Provider value={{ open, setOpen }}>
      {children}
    </SessionFinderContext.Provider>
  );
}

export function useSessionFinder() {
  return useContext(SessionFinderContext);
}
