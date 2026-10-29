import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService, { LoginCredentials, RegisterData, UserResponse } from '../../services/authService';
import { errorMessage } from '../../services/config';

// Get user from localStorage (ignore corrupt data instead of crashing on load)
const user = authService.getCurrentUser();

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: AuthState = {
  user: user,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(errorMessage(error));
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, thunkAPI) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return thunkAPI.rejectWithValue(errorMessage(error));
    }
  }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
  authService.logout();
});

// Auth slice
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<UserResponse>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
      })
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<UserResponse>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
      })
      // Logout case
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;