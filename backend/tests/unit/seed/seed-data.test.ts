import { describe, expect, it } from 'vitest';
import { createPathologyBody } from '../../../src/validators/admin/pathology.validator.js';
import { questionBody } from '../../../src/validators/question.validator.js';
import { SLUG_PATTERN } from '../../../src/constants/pagination.js';
import { slugify } from '../../../src/utils/slug.js';
import { demoAuthors, demoTopics, seedPathologies } from '../../../scripts/seed/data/index.js';

describe('données de démonstration', () => {
  it('au moins 3 pathologies, aux slugs valides et uniques', () => {
    expect(seedPathologies.length).toBeGreaterThanOrEqual(3);
    const slugs = seedPathologies.map((p) => slugify(p.title));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(SLUG_PATTERN);
  });

  describe.each(seedPathologies.map((p) => [p.title, p] as const))('%s', (_title, pathology) => {
    const { questions, ...fiche } = pathology;

    it('la fiche passe la validation de l’API, toutes sections remplies', () => {
      const parsed = createPathologyBody.parse(fiche);
      expect(parsed.exams.length).toBeGreaterThan(0);
      expect(parsed.references.length).toBeGreaterThan(0);
    });

    it('comporte une dizaine de questions QCM et QCD, toutes valides', () => {
      expect(questions.length).toBeGreaterThanOrEqual(10);
      expect(questions.some((q) => q.type === 'QCM')).toBe(true);
      expect(questions.some((q) => q.type === 'QCD')).toBe(true);
      for (const question of questions) {
        const parsed = questionBody.parse(question);
        expect(parsed.explanation, question.text).toBeTruthy();
      }
    });

    it('QCD : [Vrai, Faux] avec exactement une bonne réponse', () => {
      for (const q of questions.filter((item) => item.type === 'QCD')) {
        expect(q.options.map((o) => o.text)).toEqual(['Vrai', 'Faux']);
        expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
      }
    });

    it('QCM : plusieurs options, au moins une correcte, au moins une fausse', () => {
      for (const q of questions.filter((item) => item.type === 'QCM')) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.options.some((o) => o.isCorrect)).toBe(true);
        expect(q.options.some((o) => !o.isCorrect)).toBe(true);
      }
    });

    it('énoncés de questions uniques', () => {
      expect(new Set(questions.map((q) => q.text)).size).toBe(questions.length);
    });
  });

  it('forum : auteurs et pathologies référencés existent, compteur cohérent', () => {
    const authorIds = new Set(demoAuthors.map((a) => a.id));
    const titles = new Set(seedPathologies.map((p) => p.title));
    expect(demoTopics.length).toBeGreaterThanOrEqual(3);
    expect(new Set(demoTopics.map((t) => t.id)).size).toBe(demoTopics.length);
    for (const topic of demoTopics) {
      expect(authorIds.has(topic.authorId)).toBe(true);
      if (topic.pathologyTitle) expect(titles.has(topic.pathologyTitle)).toBe(true);
      for (const reply of topic.replies) expect(authorIds.has(reply.authorId)).toBe(true);
    }
  });
});
