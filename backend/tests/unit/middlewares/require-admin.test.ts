import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { requireAdmin } from '../../../src/middlewares/require-admin.js';

function run(user: Request['user']) {
  const next = vi.fn();
  requireAdmin({ user } as Request, {} as Response, next as unknown as NextFunction);
  return next;
}

describe('requireAdmin', () => {
  it('laisse passer un administrateur', () => {
    expect(run({ id: '1', email: null, role: 'admin' })).toHaveBeenCalledWith();
  });

  it('403 pour un utilisateur standard', () => {
    expect(run({ id: '1', email: null, role: 'user' }).mock.calls[0]?.[0]).toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('401 si authenticate n’a pas été exécuté avant', () => {
    expect(run(undefined).mock.calls[0]?.[0]).toMatchObject({ statusCode: 401 });
  });
});
