import { fetchClient } from './fetch-client';
import createClient from 'openapi-react-query';
export const tanstackClient = createClient(fetchClient);
