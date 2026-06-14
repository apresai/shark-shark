// Mock for `next-auth/react`. Its v5 ESM build is not transformed by next/jest, and the
// component tests in this repo render UI rather than exercise auth flows, so we stub the
// surface that components import (see jest.config.ts moduleNameMapper).
import type { ReactNode } from 'react';

export const signIn = jest.fn();
export const signOut = jest.fn();
export const getSession = jest.fn(async () => null);
export const useSession = jest.fn(() => ({ data: null, status: 'unauthenticated' as const }));
export const SessionProvider = ({ children }: { children: ReactNode }) => children;
