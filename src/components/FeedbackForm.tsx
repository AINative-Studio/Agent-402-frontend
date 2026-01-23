import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useWallet } from '../hooks/useWallet';
import { useSubmitFeedback } from '../hooks/useBlockchain';
import { feedbackSchema, type FeedbackFormData } from '../lib/validations';
import { cn } from '@/lib/utils';

interface FeedbackFormProps {
    /** Agent token ID to submit feedback for */
    agentTokenId: number;
    /** Agent name for display */
    agentName: string;
    /** Callback when feedback is successfully submitted */
    onSuccess?: () => void;
    /** Optional custom class name */
    className?: string;
}

/**
 * Star rating button component
 */
function RatingButton({
    rating,
    selectedRating,
    hoveredRating,
    onSelect,
    onHover,
    onLeave,
}: {
    rating: number;
    selectedRating: number;
    hoveredRating: number | null;
    onSelect: (rating: number) => void;
    onHover: (rating: number) => void;
    onLeave: () => void;
}) {
    const isActive = hoveredRating !== null
        ? rating <= hoveredRating
        : rating <= selectedRating;

    return (
        <button
            type="button"
            onClick={() => onSelect(rating)}
            onMouseEnter={() => onHover(rating)}
            onMouseLeave={onLeave}
            className={cn(
                'p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded',
                isActive && 'transform scale-110'
            )}
            aria-label={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
        >
            <Star
                className={cn(
                    'w-8 h-8 transition-colors',
                    isActive
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/30'
                )}
            />
        </button>
    );
}

/**
 * Rating labels for each star level
 */
const RATING_LABELS = [
    '',
    'Poor - Did not meet expectations',
    'Below Average - Needs improvement',
    'Average - Met basic requirements',
    'Good - Exceeded expectations',
    'Excellent - Outstanding performance',
];

/**
 * FeedbackForm - Submit feedback for agent reputation with form validation
 *
 * Features:
 * - react-hook-form integration with Zod validation
 * - Rating (1-5 stars) with interactive hover states
 * - Comment input with character count
 * - Submit to ReputationRegistry contract
 * - Loading and success states
 * - Accessible form controls
 */
export function FeedbackForm({
    agentTokenId,
    agentName,
    onSuccess,
    className,
}: FeedbackFormProps) {
    const { isConnected } = useWallet();
    const { submitFeedback, isPending, isConfirming, isSuccess, error } = useSubmitFeedback();

    const [hoveredRating, setHoveredRating] = useState<number | null>(null);

    const form = useForm<FeedbackFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(feedbackSchema) as any,
        defaultValues: {
            agentTokenId,
            rating: 0,
            comment: '',
        },
    });

    const watchRating = form.watch('rating');
    const watchComment = form.watch('comment');
    const displayRating = hoveredRating !== null ? hoveredRating : watchRating;

    // Update agent token ID when it changes
    useEffect(() => {
        form.setValue('agentTokenId', agentTokenId);
    }, [agentTokenId, form]);

    const onSubmit = async (data: FeedbackFormData) => {
        if (!isConnected) return;

        try {
            await submitFeedback(agentTokenId, data.rating, data.comment || '');
            onSuccess?.();
        } catch (err) {
            console.error('Failed to submit feedback:', err);
        }
    };

    const handleReset = () => {
        form.reset({
            agentTokenId,
            rating: 0,
            comment: '',
        });
        setHoveredRating(null);
    };

    // Success state
    if (isSuccess) {
        return (
            <Card className={className}>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Feedback Submitted</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Thank you for your feedback on {agentName}.
                    </p>
                    <Button variant="outline" onClick={handleReset}>
                        Submit Another
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Not connected state
    if (!isConnected) {
        return (
            <Card className={className}>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
                    <p className="text-sm text-muted-foreground">
                        Connect your wallet to submit feedback.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Rate {agentName}
                </CardTitle>
                <CardDescription>
                    Your feedback helps improve agent quality and builds trust.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Star Rating */}
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rating</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <RatingButton
                                                    key={star}
                                                    rating={star}
                                                    selectedRating={field.value}
                                                    hoveredRating={hoveredRating}
                                                    onSelect={(value) => field.onChange(value)}
                                                    onHover={setHoveredRating}
                                                    onLeave={() => setHoveredRating(null)}
                                                />
                                            ))}
                                        </div>
                                    </FormControl>
                                    {displayRating > 0 && (
                                        <FormDescription>
                                            {RATING_LABELS[displayRating]}
                                        </FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Comment */}
                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Comment <span className="text-muted-foreground">(optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Share your experience working with this agent..."
                                            rows={3}
                                            className="resize-none"
                                            maxLength={500}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-right">
                                        {watchComment?.length || 0}/500
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Error Display */}
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm text-destructive">
                                    {error.message || 'Failed to submit feedback'}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!watchRating || isPending || isConfirming}
                        >
                            {isPending || isConfirming ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isConfirming ? 'Confirming...' : 'Submitting...'}
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Feedback
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
