import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { RootState } from '@/app/store';

const TOKEN_KEY = 'qwertees_auth_token';

interface AuthState {
  token: string | null;
}

// Sync-hydrate from localStorage at store initialisation — no async loading needed.
// The token is either present or null before the first render.
const initialState: AuthState = {
  token: localStorage.getItem(TOKEN_KEY),
};

export const loginThunk = createAsyncThunk<
  string,
  { username: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: { token: string } }>('auth/login', {
        username,
        password,
      });
      const token = response.data.data.token;
      localStorage.setItem(TOKEN_KEY, token);
      return token;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Login failed');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem(TOKEN_KEY);
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginThunk.fulfilled, (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    });
  },
});

export const { logout } = authSlice.actions;

export const selectToken = (state: RootState): string | null => state.auth.token;
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.token !== null;

export default authSlice.reducer;
