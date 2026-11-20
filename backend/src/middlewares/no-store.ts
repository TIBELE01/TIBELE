/**
 * Interdit toute mise en cache (navigateur, proxy, CDN) des réponses d'un routeur.
 * Utilisé pour le quiz : les questions et résultats sont personnels et ne doivent
 * jamais être servis depuis un cache partagé ou le cache du service worker.
 */
import type { RequestHandler } from 'express';

export const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
