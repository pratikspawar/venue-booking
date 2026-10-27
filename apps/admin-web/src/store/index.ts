import { configureStore } from '@reduxjs/toolkit';
import venueReducer from './venueSlice';

export const store = configureStore({
  reducer: {
    venue: venueReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
