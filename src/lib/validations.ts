import { z } from 'zod';

/**
 * Zod validation schemas for form validation across the application.
 * All schemas follow consistent patterns for error messaging and validation rules.
 */

// Common validation patterns
const didPattern = /^did:ethr:0x[a-fA-F0-9]{40}$/;
const minDescriptionLength = 10;
const maxDescriptionLength = 500;
const maxNameLength = 100;
const maxTaskLength = 2000;

/**
 * Agent Hire Form Schema
 * Used when hiring an agent for a task
 */
export const agentHireSchema = z.object({
    agentTokenId: z.number({
        required_error: 'Agent selection is required',
    }).nonnegative('Invalid agent ID'),

    taskDescription: z
        .string({
            required_error: 'Task description is required',
        })
        .min(minDescriptionLength, `Task description must be at least ${minDescriptionLength} characters`)
        .max(maxTaskLength, `Task description cannot exceed ${maxTaskLength} characters`)
        .trim(),

    customPrice: z
        .number()
        .min(0, 'Price cannot be negative')
        .max(1000000, 'Price exceeds maximum allowed')
        .optional()
        .nullable(),
});

export type AgentHireFormData = z.infer<typeof agentHireSchema>;

/**
 * Feedback Form Schema
 * Used when submitting feedback for an agent
 */
export const feedbackSchema = z.object({
    agentTokenId: z.number({
        required_error: 'Agent selection is required',
    }).nonnegative('Invalid agent ID'),

    rating: z
        .number({
            required_error: 'Rating is required',
        })
        .min(1, 'Please select a rating')
        .max(5, 'Rating must be between 1 and 5'),

    comment: z
        .string()
        .max(maxDescriptionLength, `Comment cannot exceed ${maxDescriptionLength} characters`)
        .default(''),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

/**
 * Task Submit Form Schema
 * Used when submitting a new task
 */
export const taskSubmitSchema = z.object({
    title: z
        .string({
            required_error: 'Task title is required',
        })
        .min(3, 'Title must be at least 3 characters')
        .max(maxNameLength, `Title cannot exceed ${maxNameLength} characters`)
        .trim(),

    description: z
        .string({
            required_error: 'Task description is required',
        })
        .min(minDescriptionLength, `Description must be at least ${minDescriptionLength} characters`)
        .max(maxTaskLength, `Description cannot exceed ${maxTaskLength} characters`)
        .trim(),

    priority: z.enum(['low', 'medium', 'high', 'critical'], {
        required_error: 'Priority is required',
    }),

    dueDate: z
        .date()
        .min(new Date(), 'Due date must be in the future')
        .optional(),

    assignedAgentId: z
        .string()
        .optional(),

    budget: z
        .number()
        .min(0, 'Budget cannot be negative')
        .optional(),
});

export type TaskSubmitFormData = z.infer<typeof taskSubmitSchema>;

/**
 * Project Create Form Schema
 * Used when creating a new project
 */
export const projectCreateSchema = z.object({
    name: z
        .string({
            required_error: 'Project name is required',
        })
        .min(3, 'Name must be at least 3 characters')
        .max(maxNameLength, `Name cannot exceed ${maxNameLength} characters`)
        .trim()
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),

    description: z
        .string()
        .max(maxDescriptionLength, `Description cannot exceed ${maxDescriptionLength} characters`)
        .optional()
        .transform(val => val?.trim() || ''),

    tier: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'], {
        required_error: 'Tier selection is required',
    }),
});

export type ProjectCreateFormData = z.infer<typeof projectCreateSchema>;

/**
 * Agent Create/Update Form Schema
 * Used when creating or updating an agent
 * Note: Custom role validation is handled at the component level
 */
export const agentFormSchema = z.object({
    did: z
        .string({
            required_error: 'DID is required',
        })
        .regex(didPattern, 'Invalid DID format. Must be did:ethr:0x followed by 40 hex characters'),

    role: z
        .string({
            required_error: 'Role is required',
        })
        .min(1, 'Role is required'),

    customRole: z
        .string()
        .default(''),

    name: z
        .string({
            required_error: 'Name is required',
        })
        .min(1, 'Name is required')
        .max(maxNameLength, `Name cannot exceed ${maxNameLength} characters`),

    description: z
        .string()
        .max(maxDescriptionLength, `Description cannot exceed ${maxDescriptionLength} characters`)
        .default(''),

    scope: z.enum(['SYSTEM', 'PROJECT', 'RUN'], {
        required_error: 'Scope is required',
    }),
});

export type AgentFormData = z.infer<typeof agentFormSchema>;

/**
 * Search Filter Schema
 * Used for data table filtering
 */
export const searchFilterSchema = z.object({
    query: z
        .string()
        .max(200, 'Search query too long')
        .optional(),

    status: z
        .string()
        .optional(),

    dateFrom: z
        .date()
        .optional(),

    dateTo: z
        .date()
        .optional(),

    sortBy: z
        .string()
        .optional(),

    sortOrder: z
        .enum(['asc', 'desc'])
        .optional(),
}).refine(
    (data) => {
        // If both dates provided, from must be before to
        if (data.dateFrom && data.dateTo) {
            return data.dateFrom <= data.dateTo;
        }
        return true;
    },
    {
        message: 'Start date must be before end date',
        path: ['dateFrom'],
    }
);

export type SearchFilterData = z.infer<typeof searchFilterSchema>;

/**
 * Helper function to format Zod errors for display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {};

    error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
            errors[path] = err.message;
        }
    });

    return errors;
}

/**
 * Helper function to get the first error message
 */
export function getFirstError(error: z.ZodError): string {
    return error.errors[0]?.message || 'Validation failed';
}
