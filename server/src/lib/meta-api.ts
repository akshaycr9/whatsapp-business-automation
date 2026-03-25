import axios from 'axios';
import { env } from '../config/env.js';

export const metaApi = axios.create({
  baseURL: 'https://graph.facebook.com/v21.0',
  headers: {
    Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});
