import { useState } from 'react';
import { Star, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '../hooks/useWallet';
import { useSubmitFeedback } from '../hooks/useBlockchain';
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
 * FeedbackForm - Submit feedback for agent reputation
 *
 * Features:
 * - Rating (1-5 stars)
 * - Comment input
 * - Submit to ReputationRegistry contract
 * - Loading and success states
 */
export function FeedbackForm({
    agentTokenId,
    agentName,
    onSuccess,
    className,
}: FeedbackFormProps) {
    const { isConnected } = useWallet();
    const { submitFeedback, isPending, isConfirming, isSuccess, error } = useSubmitFeedback();

    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [comment, setComment] = useState('');

    const displayRating = hoveredRating !== null ? hoveredRating : rating;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!rating || !isConnected) return;

        try {
            await submitFeedback(agentTokenId, rating, comment);
            onSuccess?.();
        } catch (err) {
            console.error('Failed to submit feedback:', err);
        }
    };

    const handleReset = () => {
        setRating(0);
        setHoveredRating(null);
        setComment('');
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <RatingButton
                                    key={star}
                                    rating={star}
                                    selectedRating={rating}
                                    hoveredRating={hoveredRating}
                                    onSelect={setRating}
                                    onHover={setHoveredRating}
                                    onLeave={() => setHoveredRating(null)}
                                />
                            ))}
                        </div>
                        {displayRating > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {RATING_LABELS[displayRating]}
                            </p>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label htmlFor="feedback-comment">
                            Comment <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Textarea
                            id="feedback-comment"
                            placeholder="Share your experience working with this agent..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {comment.length}/500
                        </p>
                    </div>

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
                        disabled={!rating || isPending || isConfirming}
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
            </CardContent>
        </Card>
    );
}
