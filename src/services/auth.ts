import { User } from '../types/user';

const AUTH_KEY = 'ngajitrack_session_user';

export const authService = {
  getUser(): User | null {
    try {
      const data = sessionStorage.getItem(AUTH_KEY);
      if (!data) return null;
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  },

  setUser(user: User): void {
    try {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save session user', e);
    }
  },

  clearUser(): void {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  },

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
};
