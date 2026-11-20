import type { RequestHandler } from 'express';
import { PAGINATION } from '../constants/pagination.js';
import * as forumService from '../services/forum.service.js';
import { buildPaginationMeta } from '../utils/pagination.js';
import { getAuthUser } from '../utils/request.js';
import { createTopicBody, listTopicsQuery, topicParams } from '../validators/forum.validator.js';

/** GET /api/forum/topics — sujets paginés (10 par page), les plus récents d'abord. */
export const listTopics: RequestHandler = async (req, res) => {
  const { page } = listTopicsQuery.parse(req.query);
  const { items, total } = await forumService.listTopics(page);
  res.json({ data: items, meta: buildPaginationMeta(page, PAGINATION.FORUM_PAGE_SIZE, total) });
};

/** GET /api/forum/topics/:id — un sujet avec son premier message. */
export const getTopic: RequestHandler = async (req, res) => {
  const { id } = topicParams.parse(req.params);
  res.json({ data: await forumService.getTopic(id) });
};

/** POST /api/forum/topics — création d'un sujet (utilisateur connecté). */
export const createTopic: RequestHandler = async (req, res) => {
  const user = getAuthUser(req);
  const input = createTopicBody.parse(req.body);
  res.status(201).json({ data: await forumService.createTopic(user.id, input) });
};
