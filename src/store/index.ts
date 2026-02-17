import { configureStore } from '@reduxjs/toolkit';
import mapReducer from '../features/map/mapSlice';
import authReducer from '../features/auth/authSlice';
import configReducer from '../features/config/configSlice';

export const store = configureStore({
    reducer: {
        map: mapReducer,
        auth: authReducer,
        config: configReducer,
    },


});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
