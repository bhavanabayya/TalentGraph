/**
 * Global auth state management with Zustand
 */

import create from 'zustand';

export interface AuthState {
  accessToken: string | null;
  userId: number | null;
  userType: 'candidate' | 'company' | null;
  email: string | null;
  isAuthenticated: boolean;
  
  login: (token: string, userId: number, userType: 'candidate' | 'company', email: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  userType: null,
  email: null,
  isAuthenticated: false,

  login: (token, userId, userType, email) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_id', userId.toString());
    localStorage.setItem('user_type', userType);
    localStorage.setItem('user_email', email);

    set({
      accessToken: token,
      userId,
      userType,
      email,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_email');

    set({
      accessToken: null,
      userId: null,
      userType: null,
      email: null,
      isAuthenticated: false,
    });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');
    const email = localStorage.getItem('user_email');

    if (token && userId && userType) {
      set({
        accessToken: token,
        userId: parseInt(userId),
        userType: userType as 'candidate' | 'company',
        email,
        isAuthenticated: true,
      });
    }
  },
}));
