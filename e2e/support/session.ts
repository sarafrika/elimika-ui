import type { BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { E2E_AUTH_SECRET } from '../../playwright.config';

export type E2eRole = 'instructor' | 'organisation_user' | 'student' | 'parent' | 'course_creator' | 'admin';

export type E2eUser = {
  uuid: string;
  name: string;
  email: string;
  domains: E2eRole[];
  organisationUuid?: string;
};

const COOKIE = 'authjs.session-token';

/** Signs the browser in as this user with a session that never needs a token refresh. */
export async function signIn(context: BrowserContext, user: E2eUser, baseURL: string) {
  const value = await encode({
    secret: E2E_AUTH_SECRET,
    salt: COOKIE,
    token: {
      sub: user.uuid,
      id: user.uuid,
      name: user.name,
      email: user.email,
      accessToken: 'e2e-access-token',
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      identity: {
        uuid: user.uuid,
        domains: user.domains,
        hasOrganisationAffiliation: Boolean(user.organisationUuid),
        organisationUuid: user.organisationUuid,
      },
    },
  });
  await context.addCookies([{ name: COOKIE, value, url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
}
