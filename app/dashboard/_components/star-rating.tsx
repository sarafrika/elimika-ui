import { Star } from "lucide-react";

type StarRatingProps = {
    value: number;
    onChange: (value: number) => void;
};

export const StarRating = ({ value, onChange }: StarRatingProps) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="focus:outline-none"
                >
                    <Star
                        className={`h-6 w-6 transition ${star <= value
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};
