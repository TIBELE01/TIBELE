import type { RequestHandler } from 'express';
import { PAGINATION } from '../constants/pagination.js';
import * as quizService from '../services/quiz.service.js';
import { buildPaginationMeta } from '../utils/pagination.js';
import { getAuthUser } from '../utils/request.js';
import { idParams } from '../validators/common.validator.js';
import { pathologyParams } from '../validators/pathologies.validator.js';
import { listAttemptsQuery, submitAttemptBody } from '../validators/quiz.validator.js';

/** GET /api/quiz/pathologies/:slug/questions — questions SANS bonnes réponses. */
export const getQuestions: RequestHandler = async (req, res) => {
  const { slug } = pathologyParams.parse(req.params);
  res.json({ data: await quizService.getQuizQuestions(slug) });
};

/** POST /api/quiz/pathologies/:slug/attempts — soumission et correction serveur. */
export const submitAttempt: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { slug } = pathologyParams.parse(req.params);
  const { answers } = submitAttemptBody.parse(req.body);
  res.status(201).json({ data: await quizService.submitAttempt(user.id, slug, answers) });
};

/** GET /api/quiz/attempts — historique de l'utilisateur connecté. */
export const listAttempts: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { page } = listAttemptsQuery.parse(req.query);
  const { items, total } = await quizService.listAttempts(user.id, page);
  res.json({
    data: items,
    meta: buildPaginationMeta(page, PAGINATION.HISTORY_PAGE_SIZE, total),
  });
};

/** GET /api/quiz/attempts/:id — détail d'une de ses tentatives. */
export const getAttempt: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const { id } = idParams.parse(req.params);
  res.json({ data: await quizService.getAttempt(user.id, id) });
};
