import { describe, it, expect } from 'vitest';
import {
    agentHireSchema,
    feedbackSchema,
    taskSubmitSchema,
    projectCreateSchema,
    agentFormSchema,
    formatZodErrors,
    getFirstError,
} from './validations';

describe('Validation Schemas', () => {
    describe('agentHireSchema', () => {
        it('should validate a valid hire request', () => {
            const validData = {
                agentTokenId: 1,
                taskDescription: 'This is a valid task description with enough characters.',
            };

            const result = agentHireSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject task description that is too short', () => {
            const invalidData = {
                agentTokenId: 1,
                taskDescription: 'Short',
            };

            const result = agentHireSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative agent token ID', () => {
            const invalidData = {
                agentTokenId: -1,
                taskDescription: 'Valid description with enough characters.',
            };

            const result = agentHireSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept optional custom price', () => {
            const validData = {
                agentTokenId: 1,
                taskDescription: 'Valid description with enough characters.',
                customPrice: 100.5,
            };

            const result = agentHireSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('feedbackSchema', () => {
        it('should validate valid feedback', () => {
            const validData = {
                agentTokenId: 1,
                rating: 5,
                comment: 'Great job!',
            };

            const result = feedbackSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject rating below 1', () => {
            const invalidData = {
                agentTokenId: 1,
                rating: 0,
            };

            const result = feedbackSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject rating above 5', () => {
            const invalidData = {
                agentTokenId: 1,
                rating: 6,
            };

            const result = feedbackSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should allow empty comment', () => {
            const validData = {
                agentTokenId: 1,
                rating: 4,
            };

            const result = feedbackSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('taskSubmitSchema', () => {
        it('should validate valid task submission', () => {
            const validData = {
                title: 'Test Task',
                description: 'This is a valid task description for testing.',
                priority: 'high',
            };

            const result = taskSubmitSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid priority', () => {
            const invalidData = {
                title: 'Test Task',
                description: 'This is a valid task description for testing.',
                priority: 'urgent', // not a valid priority
            };

            const result = taskSubmitSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept all valid priorities', () => {
            const priorities = ['low', 'medium', 'high', 'critical'];

            priorities.forEach((priority) => {
                const result = taskSubmitSchema.safeParse({
                    title: 'Test Task',
                    description: 'Valid description for the test task.',
                    priority,
                });
                expect(result.success).toBe(true);
            });
        });
    });

    describe('projectCreateSchema', () => {
        it('should validate valid project', () => {
            const validData = {
                name: 'My Project',
                tier: 'PRO',
            };

            const result = projectCreateSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject name with invalid characters', () => {
            const invalidData = {
                name: 'My@Project!',
                tier: 'PRO',
            };

            const result = projectCreateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept all valid tiers', () => {
            const tiers = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

            tiers.forEach((tier) => {
                const result = projectCreateSchema.safeParse({
                    name: 'Test Project',
                    tier,
                });
                expect(result.success).toBe(true);
            });
        });
    });

    describe('agentFormSchema', () => {
        it('should validate valid agent data', () => {
            const validData = {
                did: 'did:ethr:0x1234567890123456789012345678901234567890',
                role: 'Financial Analyst',
                name: 'Test Agent',
                scope: 'PROJECT',
            };

            const result = agentFormSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid DID format', () => {
            const invalidData = {
                did: 'invalid-did',
                role: 'Financial Analyst',
                name: 'Test Agent',
                scope: 'PROJECT',
            };

            const result = agentFormSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept all valid scopes', () => {
            const scopes = ['SYSTEM', 'PROJECT', 'RUN'];

            scopes.forEach((scope) => {
                const result = agentFormSchema.safeParse({
                    did: 'did:ethr:0x1234567890123456789012345678901234567890',
                    role: 'Test Role',
                    name: 'Test Agent',
                    scope,
                });
                expect(result.success).toBe(true);
            });
        });
    });

    describe('Error Helpers', () => {
        it('formatZodErrors should format errors correctly', () => {
            const result = feedbackSchema.safeParse({
                agentTokenId: -1,
                rating: 10,
            });

            if (!result.success) {
                const errors = formatZodErrors(result.error);
                expect(errors).toHaveProperty('agentTokenId');
                expect(errors).toHaveProperty('rating');
            }
        });

        it('getFirstError should return first error message', () => {
            const result = feedbackSchema.safeParse({
                agentTokenId: -1,
                rating: 10,
            });

            if (!result.success) {
                const firstError = getFirstError(result.error);
                expect(typeof firstError).toBe('string');
                expect(firstError.length).toBeGreaterThan(0);
            }
        });
    });
});
