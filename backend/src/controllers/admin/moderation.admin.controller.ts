import type { RequestHandler } from 'express';
import * as service from '../../services/admin/moderation.admin.service.js';
import { idParams } from '../../validators/common.validator.js';

/** DELETE /api/admin/forum/topics/:id */
export const deleteTopic: RequestHandler = async (req, res) => {
  const { id } = idParams.parse(req.params);
  await service.deleteTopic(id);
  res.status(204).end();
};

/** DELETE /api/admin/forum/posts/:id */
export const deletePost: RequestHandler = async (req, res) => {
  const { id } = idParams.parse(req.params);
  await service.deletePost(id);
  res.status(204).end();
};
