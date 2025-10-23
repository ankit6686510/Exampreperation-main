interface ProgressBarProps {
  current: number;
  total: number;
  color?: 'primary' | 'success' | 'warning';
}

const ProgressBar = ({ current, total, color = 'primary' }: ProgressBarProps) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium text-foreground">
          {current}/{total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${colorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
