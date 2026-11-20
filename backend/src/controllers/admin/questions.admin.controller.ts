import type { RequestHandler } from 'express';
import * as service from '../../services/admin/questions.admin.service.js';
import { idParams } from '../../validators/common.validator.js';
import { questionBody } from '../../validators/question.validator.js';

/** GET /api/admin/pathologies/:id/questions — avec les bonnes réponses (admin uniquement). */
export const listQuestions: RequestHandler = async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json({ data: await service.listQuestions(id) });
};

/** POST /api/admin/pathologies/:id/questions */
export const createQuestion: RequestHandler = async (req, res) => {
  const { id } = idParams.parse(req.params);
  const input = questionBody.parse(req.body);
  res.status(201).json({ data: await service.createQuestion(id, input) });
};

/** PUT /api/admin/questions/:id */
export const updateQuestion: RequestHandler = async (req, res) => {
  const { id } = idParams.parse(req.params);
  const input = questionBody.parse(req.body);
  res.json({ data: await service.updateQuestion(id, input) });
};

/** DELETE /api/admin/questions/:id */
export const deleteQuestion: RequestHandler = async (req, res) => {
  const { id } = idParams.parse(req.params);
  await service.deleteQuestion(id);
  res.status(204).end();
};
