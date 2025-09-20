/**
 * Dynamic Prompt Management Service
 * 
 * This service provides functionality to store, retrieve, and optimize AI prompts
 * using a meta-prompt strategy. Instead of hardcoding prompts in the application,
 * prompts are stored in the database and can be dynamically optimized over time.
 */

import { db } from '../db';
import { aiPrompts, promptPerformance } from '@shared/prompt-schema';
import { eq, desc } from 'drizzle-orm';
import { geminiService } from './gemini';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

interface PromptOptimizationRequest {
    name: string;
    goal: string;
    constraints?: string[];
    examples?: { input: string; output: string }[];
}

export class PromptManagementService {
    /**
     * Get a prompt by name
     * Returns the optimized version if available, otherwise the base version
     */
    async getPrompt(name: string): Promise<string> {
        try {
            const prompt = await db.select().from(aiPrompts).where(eq(aiPrompts.name, name)).limit(1);

            if (!prompt || prompt.length === 0) {
                throw new Error(`Prompt with name "${name}" not found`);
            }

            // Update usage count
            await db.update(aiPrompts)
                .set({ usageCount: (parseInt(prompt[0].usageCount) + 1).toString() })
                .where(eq(aiPrompts.id, prompt[0].id));

            // Return optimized prompt if available, otherwise base prompt
            return prompt[0].optimizedPrompt || prompt[0].basePrompt;
        } catch (error) {
            logger.error(error instanceof Error ? error : new Error(`Failed to retrieve prompt "${name}"`), { operation: 'getPrompt' });
            throw error;
        }
    }

    /**
     * Create a new prompt
     */
    async createPrompt(name: string, basePrompt: string, tags: string[] = []): Promise<string> {
        try {
            const existingPrompt = await db.select().from(aiPrompts)
                .where(eq(aiPrompts.name, name))
                .limit(1);

            if (existingPrompt && existingPrompt.length > 0) {
                throw new Error(`Prompt with name "${name}" already exists`);
            }

            const [newPrompt] = await db.insert(aiPrompts).values({
                name,
                basePrompt,
                version: '1.0',
                tags,
                usageCount: '0'
            }).returning();

            return newPrompt.id;
        } catch (error) {
            logger.error(error instanceof Error ? error : new Error(`Failed to create prompt "${name}"`), { operation: 'createPrompt' });
            throw error;
        }
    }

    /**
     * Optimize a prompt using Gemini meta-prompting
     */
    async optimizePrompt(request: PromptOptimizationRequest): Promise<string> {
        try {
            // Get the original prompt
            const prompt = await db.select().from(aiPrompts)
                .where(eq(aiPrompts.name, request.name))
                .limit(1);

            if (!prompt || prompt.length === 0) {
                throw new Error(`Prompt with name "${request.name}" not found`);
            }

            const originalPrompt = prompt[0].optimizedPrompt || prompt[0].basePrompt;

            // Create meta-prompt for optimization
            const metaPrompt = this.buildOptimizationMetaPrompt(
                originalPrompt,
                request.goal,
                request.constraints || [],
                request.examples || []
            );

            // Get optimized prompt from Gemini
            const optimizedPrompt = await geminiService.getPromptOptimization(metaPrompt);

            // Update the prompt in the database
            await db.update(aiPrompts)
                .set({
                    optimizedPrompt,
                    version: this.incrementVersion(prompt[0].version),
                    updatedAt: new Date()
                })
                .where(eq(aiPrompts.id, prompt[0].id));

            return optimizedPrompt;
        } catch (error) {
            logger.error(error instanceof Error ? error : new Error(`Failed to optimize prompt "${request.name}"`), { operation: 'optimizePrompt' });
            throw error;
        }
    }

    /**
     * Add performance feedback for a prompt
     */
    async addPromptPerformance(promptName: string, decisionId: string, success: boolean, feedback: string): Promise<void> {
        try {
            // Get the prompt ID
            const prompt = await db.select().from(aiPrompts)
                .where(eq(aiPrompts.name, promptName))
                .limit(1);

            if (!prompt || prompt.length === 0) {
                throw new Error(`Prompt with name "${promptName}" not found`);
            }

            // Calculate a performance score (simplified)
            const performanceScore = success ? 5.0 : 2.0;

            // Add performance record
            await db.insert(promptPerformance).values({
                promptId: prompt[0].id,
                decisionId,
                performanceScore: performanceScore.toString(),
                tradeSuccess: success,
                feedbackType: success ? 'success' : 'failure',
                feedback
            });
        } catch (error) {
            logger.error(error instanceof Error ? error : new Error(`Failed to add performance data for prompt "${promptName}"`), { operation: 'addPromptPerformance' });
        }
    }

    /**
     * List all available prompts
     */
    async listPrompts(): Promise<any[]> {
        try {
            return await db.select({
                id: aiPrompts.id,
                name: aiPrompts.name,
                version: aiPrompts.version,
                usageCount: aiPrompts.usageCount,
                tags: aiPrompts.tags,
                updatedAt: aiPrompts.updatedAt
            })
                .from(aiPrompts)
                .orderBy(desc(aiPrompts.updatedAt));
        } catch (error) {
            logger.error(error instanceof Error ? error : new Error("Failed to list prompts"), { operation: 'listPrompts' });
            throw error;
        }
    }

    /**
     * Build a meta-prompt for optimization
     */
    private buildOptimizationMetaPrompt(
        originalPrompt: string,
        goal: string,
        constraints: string[] = [],
        examples: { input: string; output: string }[] = []
    ): string {
        let examplesText = '';
        if (examples.length > 0) {
            examplesText = 'Examples:\n' + examples.map(ex =>
                `Input: ${ex.input}\nDesired Output: ${ex.output}`
            ).join('\n\n');
        }

        let constraintsText = '';
        if (constraints.length > 0) {
            constraintsText = 'Constraints:\n- ' + constraints.join('\n- ');
        }

        return `
You are an expert prompt engineer specializing in financial trading and risk management AI systems.
Your task is to optimize the following prompt to improve its effectiveness.

ORIGINAL PROMPT:
"""
${originalPrompt}
"""

OPTIMIZATION GOAL:
${goal}

${constraintsText}

${examplesText}

Please provide an optimized version of the prompt that:
1. Is more precise and focused on the specific task
2. Includes better structured guidance for the AI model
3. Elicits more actionable and reliable responses
4. Maintains the core objective of the original prompt
5. Uses clear, unambiguous language

Return only the optimized prompt without explanations or additional text.
`;
    }

    /**
     * Increment version string (e.g. "1.0" -> "1.1")
     */
    private incrementVersion(version: string): string {
        const parts = version.split('.');
        if (parts.length === 1) return `${version}.1`;

        const major = parseInt(parts[0]);
        const minor = parseInt(parts[1]) + 1;

        return `${major}.${minor}`;
    }
}

// Singleton instance
export const promptManagementService = new PromptManagementService();