import { configureStore } from '@reduxjs/toolkit';
import customerReducer from './customerSlice';

export const store = configureStore({
  reducer: {
    customer: customerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
