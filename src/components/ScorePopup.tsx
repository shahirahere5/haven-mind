import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";

interface ScorePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  maxScore: number;
  recommendation: string;
  surveyTitle: string;
}

export function ScorePopup({
  open,
  onOpenChange,
  score,
  maxScore,
  recommendation,
  surveyTitle,
}: ScorePopupProps) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-glass-border/30 sm:max-w-[500px]">
        <div className="text-center py-8 space-y-6 animate-fade-in">
          <div className="flex justify-center">
            <Award className="h-16 w-16 text-lamp/60" />
          </div>

          <div>
            <h2 className="font-display text-3xl text-ink mb-2">
              Survey Complete!
            </h2>
            <p className="text-sm text-muted-foreground/60">{surveyTitle}</p>
          </div>

          <div className="bg-glass rounded-xl p-6">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground/60 mb-2">Your Score</p>
              <p className="font-display text-5xl text-lamp">
                {score}/{maxScore}
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                {percentage}% complete
              </p>
            </div>

            <div className="w-full bg-glass-border/30 rounded-full h-2">
              <div
                className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="bg-lamp/5 border border-lamp/10 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-ink/80 mb-2">
              Recommendations:
            </p>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              {recommendation}
            </p>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
            style={{ background: "var(--gradient-primary)" }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
