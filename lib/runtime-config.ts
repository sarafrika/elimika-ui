import 'server-only';

const normalize = (value?: string) => value?.trim();

const parseRealmFromIssuer = (issuer?: string) => {
  if (!issuer) {
    return undefined;
  }

  const match = issuer.match(/\/realms\/([^/]+)\/?$/);
  return match?.[1];
};

export const getRuntimeAuthRealm = () => {
  const explicitRealm = normalize(process.env.KEYCLOAK_REALM ?? process.env.NEXT_PUBLIC_KEYCLOAK_REALM);
  if (explicitRealm) {
    return explicitRealm;
  }
  return normalize(parseRealmFromIssuer(process.env.KEYCLOAK_ISSUER)) ?? '';
};
