import * as React from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { AuthLayout, AuthHeader, AuthFooter } from "@/components/layout/auth-layout";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { getApi } from "@/lib/api";
import { PasswordRequirementsList } from "./password-requirements";
import { ResetPasswordSuccessState, ResetPasswordErrorState } from "./reset-password-states";

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/reset-password" });
  const token = (search as { token?: string })?.token || "";
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [resetStatus, setResetStatus] = React.useState<"form" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = React.useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  // Check for token on mount
  React.useEffect(() => {
    if (!token) {
      setResetStatus("error");
      setErrorMessage("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setResetStatus("error");
      setErrorMessage("Invalid or missing reset token.");
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const api = getApi();
      await api.auth.resetPassword(token, data.newPassword);
      setResetStatus("success");
    } catch (error) {
      setResetStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to reset password. The link may be invalid or expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (resetStatus === "success") {
    return (
      <ResetPasswordSuccessState
        onNavigateToLogin={() => navigate({ to: "/login" })}
      />
    );
  }

  // Error state
  if (resetStatus === "error") {
    return (
      <ResetPasswordErrorState
        errorMessage={errorMessage}
        onNavigateToForgotPassword={() => navigate({ to: "/forgot-password" })}
        onNavigateToLogin={() => navigate({ to: "/login" })}
      />
    );
  }

  // Form state
  return (
    <AuthLayout>
      <AuthHeader
        title="Reset your password"
        description="Enter your new password below"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        {/* New Password */}
        <div className="grid gap-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter your new password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register("newPassword", {
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                validate: {
                  hasUppercase: (value) =>
                    /[A-Z]/.test(value) ||
                    "Password must contain at least one uppercase letter",
                  hasLowercase: (value) =>
                    /[a-z]/.test(value) ||
                    "Password must contain at least one lowercase letter",
                  hasNumber: (value) =>
                    /[0-9]/.test(value) ||
                    "Password must contain at least one number",
                },
              })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}

          {/* Password Requirements */}
          <PasswordRequirementsList password={newPassword} />
        </div>

        {/* Confirm Password */}
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register("confirmPassword", {
                required: "Please confirm your new password",
                validate: (value) =>
                  value === newPassword || "Passwords do not match",
              })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset Password
        </Button>
      </form>

      <AuthFooter>
        <Button
          variant="link"
          className="text-sm text-muted-foreground p-0 h-auto"
          onClick={() => navigate({ to: "/login" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>
      </AuthFooter>
    </AuthLayout>
  );
}
