import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use these throughout the app instead of plain useDispatch / useSelector.
// They are fully typed against our store, so no manual type annotations are
// needed at each call site.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
