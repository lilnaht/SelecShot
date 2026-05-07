import { Progress } from "@/components/ui/progress";

type UploadProgressProps = {
  value: number;
  label: string;
  description?: string;
};

export function UploadProgress({ value, label, description }: UploadProgressProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-muted-foreground">{Math.round(value)}%</span>
      </div>
      <Progress value={value} className="w-full" />
      {description && (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
