/** Simulation de `supabaseAdmin.auth.getUser` : jetons « jeton-user » et « jeton-admin ». */
export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const ADMIN_ID = '99999999-9999-4999-8999-999999999999';

export const supabaseMock = {
  supabaseAdmin: {
    auth: {
      getUser: (token: string) => {
        const users: Record<string, { id: string; role: string }> = {
          'jeton-user': { id: USER_ID, role: 'user' },
          'jeton-admin': { id: ADMIN_ID, role: 'admin' },
        };
        const found = users[token];
        return Promise.resolve(
          found
            ? {
                data: {
                  user: {
                    id: found.id,
                    email: `${found.role}@x.ci`,
                    app_metadata: { role: found.role },
                  },
                },
                error: null,
              }
            : { data: { user: null }, error: { name: 'AuthApiError', status: 401 } },
        );
      },
    },
  },
};
