import registry from "./data/quizdata.json";

import dbms from "./data/dbms.json";
import dcn from "./data/dcn.json";
import os from "./data/os.json";
import foc from "./data/foc.json";

const DATA_BY_SLUG = {
  dbms,
  dcn,
  os,
  foc,
};

export function getQuizConcept(slug) {
  return registry.concepts.find((c) => c.slug === slug) || null;
}

export function listQuizConcepts() {
  return registry.concepts;
}

export function getQuizDataBySlug(slug) {
  return DATA_BY_SLUG[slug] || null;
}
