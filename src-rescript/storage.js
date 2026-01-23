/**
 * Async file-based storage for learning experiences
 * Uses promises instead of sync I/O for better performance
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storage manager for learning experiences
 */
export class ExperienceStorage {
  constructor(storageDir = './ubicity-data') {
    this.storageDir = path.resolve(storageDir);
    this.experiencesDir = path.join(this.storageDir, 'experiences');
    this.mapsDir = path.join(this.storageDir, 'maps');
    this.analysesDir = path.join(this.storageDir, 'analyses');
  }

  /**
   * Ensure all storage directories exist
   */
  async ensureDirectories() {
    await fs.mkdir(this.storageDir, { recursive: true });
    await fs.mkdir(this.experiencesDir, { recursive: true });
    await fs.mkdir(this.mapsDir, { recursive: true });
    await fs.mkdir(this.analysesDir, { recursive: true });
  }

  /**
   * Save an experience to disk
   * @param {object} experience - Validated experience object
   * @returns {Promise<string>} File path where saved
   */
  async saveExperience(experience) {
    await this.ensureDirectories();

    const filename = `${experience.id}.json`;
    const filepath = path.join(this.experiencesDir, filename);

    await fs.writeFile(
      filepath,
      JSON.stringify(experience, null, 2),
      'utf8'
    );

    return filepath;
  }

  /**
   * Load a single experience by ID
   * @param {string} id - Experience ID
   * @returns {Promise<object|null>} Experience data or null if not found
   */
  async loadExperience(id) {
    const filename = `${id}.json`;
    const filepath = path.join(this.experiencesDir, filename);

    try {
      const content = await fs.readFile(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Load all experiences from storage
   * @returns {Promise<object[]>} Array of all experiences
   */
  async loadAllExperiences() {
    try {
      await this.ensureDirectories();
      const files = await fs.readdir(this.experiencesDir);

      const experiences = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const filepath = path.join(this.experiencesDir, file);
            const content = await fs.readFile(filepath, 'utf8');
            return JSON.parse(content);
          })
      );

      return experiences;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Delete an experience
   * @param {string} id - Experience ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteExperience(id) {
    const filename = `${id}.json`;
    const filepath = path.join(this.experiencesDir, filename);

    try {
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Save an analysis report
   * @param {object} report - Analysis report
   * @param {string} [name] - Optional name, otherwise uses timestamp
   * @returns {Promise<string>} File path where saved
   */
  async saveReport(report, name = null) {
    await this.ensureDirectories();

    const filename = name || `report-${Date.now()}.json`;
    const filepath = path.join(this.analysesDir, filename);

    await fs.writeFile(
      filepath,
      JSON.stringify(report, null, 2),
      'utf8'
    );

    return filepath;
  }

  /**
   * Save a visualization/map
   * @param {string} html - HTML content
   * @param {string} name - File name
   * @returns {Promise<string>} File path where saved
   */
  async saveVisualization(html, name = 'ubicity-map.html') {
    await this.ensureDirectories();

    const filepath = path.join(this.storageDir, name);
    await fs.writeFile(filepath, html, 'utf8');

    return filepath;
  }

  /**
   * List all experience IDs
   * @returns {Promise<string[]>} Array of experience IDs
   */
  async listExperienceIds() {
    try {
      const files = await fs.readdir(this.experiencesDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<object>} Storage stats
   */
  async getStats() {
    const experiences = await this.listExperienceIds();

    let totalSize = 0;
    for (const id of experiences) {
      const filepath = path.join(this.experiencesDir, `${id}.json`);
      const stats = await fs.stat(filepath);
      totalSize += stats.size;
    }

    return {
      totalExperiences: experiences.length,
      totalSizeBytes: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      storageDir: this.storageDir,
    };
  }
}
