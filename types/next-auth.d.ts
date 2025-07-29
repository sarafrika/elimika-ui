import { DefaultSession } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';
import { User as ClientUser } from '../services/client';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] &
      ClientUser &
      {
        id: string;
        accessToken: string;
        id_token: string;
        student_uuid?: string;
        instructor_uuid?: string;
      };
    decoded: NextAuthJWT & {
      realm_access?: {
        roles?: string[];
      };
      resource_access?: {
        'realm-management'?: {
          roles?: string[];
        };
        account?: {
          roles?: string[];
        };
        [key: string]:
          | {
          roles?: string[];
        }
          | undefined;
      };
      organisation?: string[];
      'organisation-slug'?: string;
    };
    error?: 'RefreshAccessTokenError';
  }

  interface User extends ClientUser {
    id?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken: string;
    refreshToken?: string;
    accessTokenExpires: number;
    id_token: string;
    realm_access?: {
      roles?: string[];
    };
    resource_access?: {
      'realm-management'?: {
        roles?: string[];
      };
      account?: {
        roles?: string[];
      };
      [key: string]:
        | {
        roles?: string[];
      }
        | undefined;
    };
    organisation?: string[];
    'organisation-slug'?: string;
    error?: 'RefreshAccessTokenError';
  }
}