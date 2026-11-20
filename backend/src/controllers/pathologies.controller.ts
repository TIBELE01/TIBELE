import type { RequestHandler } from 'express';
import { buildPaginationMeta } from '../utils/pagination.js';
import * as pathologiesService from '../services/pathologies.service.js';
import { listPathologiesQuery, pathologyParams } from '../validators/pathologies.validator.js';

/** GET /api/pathologies — liste paginée, avec recherche facultative (`q`). */
export const listPathologies: RequestHandler = async (req, res) => {
  const query = listPathologiesQuery.parse(req.query);
  const { items, total } = await pathologiesService.listPathologies(query);
  res.json({ data: items, meta: buildPaginationMeta(query.page, query.limit, total) });
};

/** GET /api/pathologies/:slug — fiche complète. */
export const getPathology: RequestHandler = async (req, res) => {
  const { slug } = pathologyParams.parse(req.params);
  res.json({ data: await pathologiesService.getPathologyBySlug(slug) });
};
