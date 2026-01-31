import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui";

interface SuccessStateProps {
  onNavigateToLogin: () => void;
}

export function ResetPasswordSuccessState({ onNavigateToLogin }: SuccessStateProps) {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Password reset successful</h1>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Your password has been reset. You can now log in.
        </p>
      </div>

      <Button
        className="w-full h-9 text-[13px] mt-4"
        onClick={onNavigateToLogin}
      >
        Continue to Login
      </Button>
    </AuthLayout>
  );
}

interface ErrorStateProps {
  errorMessage: string;
  onNavigateToForgotPassword: () => void;
  onNavigateToLogin: () => void;
}

export function ResetPasswordErrorState({
  errorMessage,
  onNavigateToForgotPassword,
  onNavigateToLogin,
}: ErrorStateProps) {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Reset link invalid</h1>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          {errorMessage}
        </p>
      </div>

      <div className="space-y-2 mt-4">
        <Button
          className="w-full h-9 text-[13px]"
          onClick={onNavigateToForgotPassword}
        >
          Request new reset link
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-9 text-[13px]"
          onClick={onNavigateToLogin}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to login
        </Button>
      </div>
    </AuthLayout>
  );
}
