/**
 * API routes for managing AI prompts
 */

import { Router } from 'express';
import { promptManagementService } from '../services/prompt-management';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { validateSchema } from '../schemas/validation';

const router = Router();

// Validation schemas
const createPromptSchema = z.object({
    name: z.string().min(3).max(100),
    basePrompt: z.string().min(10),
    tags: z.array(z.string()).optional()
});

const optimizePromptSchema = z.object({
    name: z.string().min(3).max(100),
    goal: z.string().min(10),
    constraints: z.array(z.string()).optional(),
    examples: z.array(
        z.object({
            input: z.string(),
            output: z.string()
        })
    ).optional()
});

const addPerformanceSchema = z.object({
    promptName: z.string().min(3).max(100),
    decisionId: z.string().uuid(),
    success: z.boolean(),
    feedback: z.string()
});

// Get all prompts
router.get('/', authenticate, async (req, res) => {
    try {
        const prompts = await promptManagementService.listPrompts();
        res.json({
            success: true,
            data: prompts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get prompt by name
router.get('/:name', authenticate, async (req, res) => {
    try {
        const { name } = req.params;
        const prompt = await promptManagementService.getPrompt(name);
        res.json({
            success: true,
            data: prompt
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Create new prompt
router.post('/', authenticate, validateSchema(createPromptSchema), async (req, res) => {
    try {
        const { name, basePrompt, tags } = req.body;
        const promptId = await promptManagementService.createPrompt(name, basePrompt, tags);
        res.status(201).json({
            success: true,
            data: {
                id: promptId,
                name
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Optimize prompt
router.post('/:name/optimize', authenticate, validateSchema(optimizePromptSchema), async (req, res) => {
    try {
        const optimizedPrompt = await promptManagementService.optimizePrompt(req.body);
        res.json({
            success: true,
            data: {
                optimizedPrompt
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Add performance feedback
router.post('/performance', authenticate, validateSchema(addPerformanceSchema), async (req, res) => {
    try {
        const { promptName, decisionId, success, feedback } = req.body;
        await promptManagementService.addPromptPerformance(promptName, decisionId, success, feedback);
        res.json({
            success: true
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;