import { Skeleton } from "@/components/ui/skeleton"

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Please wait, loading content..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px] bg-muted/50" />
          <Skeleton className="h-8 w-[200px] bg-muted/50" />
        </div>

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-2">
            <div className="h-4 w-4 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <div className="h-4 w-4 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <div className="h-4 w-4 animate-bounce rounded-full bg-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}
