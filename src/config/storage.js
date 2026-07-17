/**
 * Storage configuration and repository access.
 *
 * Minimal localStorage-backed reconstruction of the repository interface
 * expected by src/features/progress/. The original implementation lived
 * only on abandoned infrastructure branches and depended on process.env,
 * which does not exist in this no-build browser app.
 */

import { getLocalStorage, setLocalStorage } from '../utils/common.js';

const PROGRESS_KEY_PREFIX = 'learnimals_progress_';

class LocalStorageRepository {
  async getUserProgress(userId) {
    if (!userId) return null;
    return getLocalStorage(`${PROGRESS_KEY_PREFIX}${userId}`) || null;
  }

  async updateUserProgress(userId, progressData) {
    if (!userId) return false;
    setLocalStorage(`${PROGRESS_KEY_PREFIX}${userId}`, progressData);
    return true;
  }
}

let repository = null;

export async function getRepository() {
  if (!repository) {
    repository = new LocalStorageRepository();
  }
  return repository;
}

export default { getRepository };
