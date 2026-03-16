// SPDX-License-Identifier: PMPL-1.0-or-later
/**
 * Zod schemas for UbiCity Learning Experiences
 * Provides runtime validation with clear error messages
 */

import { z } from 'zod';

// Core WHO/WHERE/WHAT - Minimal Viable Protocol
export const MinimalLearnerSchema = z.object({
  id: z.string().min(1, 'Learner ID is required'),
});

export const MinimalLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
});

export const MinimalExperienceSchema = z.object({
  type: z.string().min(1, 'Experience type is required'),
  description: z.string().min(1, 'Description is required'),
});

// Optional enrichment fields
export const LearnerSchema = MinimalLearnerSchema.extend({
  name: z.string().optional(),
  background: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const LocationSchema = MinimalLocationSchema.extend({
  coordinates: CoordinatesSchema.optional(),
  type: z.string().optional(), // makerspace, library, park, etc.
  address: z.string().optional(),
});

export const ContextSchema = z.object({
  location: LocationSchema,
  situation: z.string().optional(),
  connections: z.array(z.string()).optional(), // Other people involved
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
});

export const OutcomeSchema = z.object({
  success: z.boolean().optional(),
  connections_made: z.array(z.string()).optional(),
  next_questions: z.array(z.string()).optional(),
  artifacts: z.array(z.string()).optional(),
});

export const ExperienceSchema = MinimalExperienceSchema.extend({
  domains: z.array(z.string()).optional(),
  outcome: OutcomeSchema.optional(),
  duration: z.number().positive().optional(), // minutes
  intensity: z.enum(['low', 'medium', 'high']).optional(),
});

export const PrivacySchema = z.object({
  level: z.enum(['private', 'anonymous', 'public']).default('anonymous'),
  shareableWith: z.array(z.string()).optional(),
});

export const LearningExperienceSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith('ubi-')),
  timestamp: z.string().datetime(),
  learner: LearnerSchema,
  context: ContextSchema,
  experience: ExperienceSchema,
  privacy: PrivacySchema.optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().default('0.2.0'),
});

// Export types (for JSDoc)
export const schemas = {
  LearningExperience: LearningExperienceSchema,
  Learner: LearnerSchema,
  Location: LocationSchema,
  Context: ContextSchema,
  Experience: ExperienceSchema,
  Outcome: OutcomeSchema,
  Privacy: PrivacySchema,
  Coordinates: CoordinatesSchema,

  // Minimal variants
  MinimalLearner: MinimalLearnerSchema,
  MinimalLocation: MinimalLocationSchema,
  MinimalExperience: MinimalExperienceSchema,
};

/**
 * Validate a learning experience
 * @param {unknown} data - Data to validate
 * @returns {z.infer<typeof LearningExperienceSchema>} Validated data
 * @throws {z.ZodError} If validation fails
 */
export function validateExperience(data) {
  return LearningExperienceSchema.parse(data);
}

/**
 * Safely validate with detailed error messages
 * @param {unknown} data - Data to validate
 * @returns {{ success: true, data: object } | { success: false, errors: string[] }}
 */
export function safeValidateExperience(data) {
  const result = LearningExperienceSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });

  return { success: false, errors };
}
