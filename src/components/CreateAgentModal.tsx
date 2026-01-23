import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
import { useCreateAgent } from '../hooks/useAgents';
import { useProject } from '../hooks/useProject';
import { useToast } from '../contexts/ToastContext';
import type { AgentScope } from '../lib/types';
import { generateDID } from '../lib/didUtils';
import { agentFormSchema, type AgentFormData } from '../lib/validations';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ROLE_OPTIONS = [
    { value: 'Financial Analyst', label: 'Financial Analyst' },
    { value: 'Compliance Officer', label: 'Compliance Officer' },
    { value: 'Transaction Executor', label: 'Transaction Executor' },
    { value: 'Custom', label: 'Custom' },
];

const SCOPE_OPTIONS: { value: AgentScope; label: string; description: string }[] = [
    { value: 'SYSTEM', label: 'System', description: 'System-wide agent' },
    { value: 'PROJECT', label: 'Project', description: 'Project-scoped agent' },
    { value: 'RUN', label: 'Run', description: 'Run-scoped agent' },
];

/**
 * CreateAgentModal - Modal for creating new agents with form validation
 *
 * Features:
 * - react-hook-form integration with Zod validation
 * - DID generation
 * - Role selection with custom role support
 * - Scope selection (System/Project/Run)
 * - Character count feedback
 * - Accessible form controls with proper ARIA attributes
 */
export function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
    const { currentProject } = useProject();
    const createMutation = useCreateAgent(currentProject?.project_id);
    const toast = useToast();

    const form = useForm<AgentFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(agentFormSchema) as any,
        defaultValues: {
            did: '',
            role: '',
            customRole: '',
            name: '',
            description: '',
            scope: 'PROJECT',
        },
    });

    const watchRole = form.watch('role');
    const watchName = form.watch('name');
    const watchDescription = form.watch('description');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    const handleGenerateDID = () => {
        const newDID = generateDID();
        form.setValue('did', newDID, { shouldValidate: true });
        toast.info('DID generated successfully');
    };

    const onSubmit = async (data: AgentFormData) => {
        const effectiveRole = data.role === 'Custom' ? data.customRole! : data.role;

        try {
            await createMutation.mutateAsync({
                did: data.did,
                role: effectiveRole,
                name: data.name,
                description: data.description || undefined,
                scope: data.scope,
            });

            toast.success('Agent created successfully');
            handleClose();
        } catch (error) {
            toast.error('Failed to create agent');
            console.error('Failed to create agent:', error);
        }
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Create Agent</DialogTitle>
                    <DialogDescription>
                        Create a new agent with a unique DID and configure its role and permissions.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* DID Input */}
                        <FormField
                            control={form.control}
                            name="did"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        DID <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input
                                                placeholder="did:ethr:0x..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            onClick={handleGenerateDID}
                                            variant="secondary"
                                            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Generate
                                        </Button>
                                    </div>
                                    <FormDescription>
                                        Must start with "did:ethr:" followed by a 40-character hexadecimal address
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Role Dropdown */}
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Role <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Custom Role Input */}
                        {watchRole === 'Custom' && (
                            <FormField
                                control={form.control}
                                name="customRole"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Custom Role <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter custom role"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Name Input */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Agent name"
                                            maxLength={100}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {watchName?.length || 0}/100 characters
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description Textarea */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Agent description (optional)"
                                            rows={3}
                                            maxLength={500}
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {watchDescription?.length || 0}/500 characters
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Scope Selector */}
                        <FormField
                            control={form.control}
                            name="scope"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Scope <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <div className="grid grid-cols-3 gap-3">
                                        {SCOPE_OPTIONS.map((option) => (
                                            <Button
                                                key={option.value}
                                                type="button"
                                                variant={field.value === option.value ? 'default' : 'outline'}
                                                onClick={() => field.onChange(option.value)}
                                                className="h-auto flex-col p-3"
                                            >
                                                <span className="font-medium">{option.label}</span>
                                                <span className="text-xs mt-1 opacity-80">{option.description}</span>
                                            </Button>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Error Message from API */}
                        {createMutation.isError && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Failed to create agent. Please try again.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="flex-1"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Agent'
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleClose}
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
