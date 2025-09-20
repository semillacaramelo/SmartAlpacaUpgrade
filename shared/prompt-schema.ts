import { pgTable, uuid, text, varchar, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';
import { aiDecisions } from './schema';

/**
 * AI Prompts schema
 * Stores versioned AI prompts that can be retrieved and optimized dynamically
 */
export const aiPrompts = pgTable('ai_prompts', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    basePrompt: text('base_prompt').notNull(),
    optimizedPrompt: text('optimized_prompt'),
    version: varchar('version', { length: 20 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    usageCount: uuid('usage_count').default('0').notNull(),
    tags: text('tags').array(),
    metadata: text('metadata')
});

// Relation to track prompt performance
export const promptPerformance = pgTable('prompt_performance', {
    id: uuid('id').defaultRandom().primaryKey(),
    promptId: uuid('prompt_id').references(() => aiPrompts.id).notNull(),
    decisionId: uuid('decision_id').references(() => aiDecisions.id),
    performanceScore: numeric('performance_score', { precision: 5, scale: 2 }),
    tradeSuccess: boolean('trade_success'),
    feedbackType: varchar('feedback_type', { length: 50 }),
    feedback: text('feedback'),
    createdAt: timestamp('created_at').defaultNow().notNull()
});