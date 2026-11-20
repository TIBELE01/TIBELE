import type { RequestHandler } from 'express';
import * as service from '../../services/admin/pathologies.admin.service.js';
import {
  createPathologyBody,
  updatePathologyBody,
} from '../../validators/admin/pathology.validator.js';
import { idParams } from '../../validators/common.validator.js';

/** POST /api/admin/pathologies */
export const createPathology: RequestHandler = async (req, res) => {
  const input = createPathologyBody.parse(req.body);
  res.status(201).json({ data: await service.createPathology(input) });
};

/** PATCH /api/admin/pathologies/:id */
export const updatePathology: RequestHandler = async (req, res) => {
  const { id } = idParams.parse(req.params);
  const input = updatePathologyBody.parse(req.body);
  res.json({ data: await service.updatePathology(id, input) });
};

/** DELETE /api/admin/pathologies/:id */
export const deletePathology: RequestHandler = async (req, res) => {
  const { id } = idParams.parse(req.params);
  await service.deletePathology(id);
  res.status(204).end();
};
