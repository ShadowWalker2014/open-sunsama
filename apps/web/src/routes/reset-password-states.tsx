import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui";

interface SuccessStateProps {
  onNavigateToLogin: () => void;
}

export function ResetPasswordSuccessState({ onNavigateToLogin }: SuccessStateProps) {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Password reset successful</h1>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
      </div>

      <Button
        className="w-full"
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
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset link invalid</h1>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          {errorMessage}
        </p>
      </div>

      <div className="space-y-2">
        <Button
          className="w-full"
          onClick={onNavigateToForgotPassword}
        >
          Request new reset link
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={onNavigateToLogin}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>
      </div>
    </AuthLayout>
  );
}
