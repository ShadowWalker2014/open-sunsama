// @ts-nocheck
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { AuthLayout, AuthHeader, AuthFooter } from "@/components/layout/auth-layout";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { getApi } from "@/lib/api";

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const api = getApi();
      await api.auth.requestPasswordReset(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (error) {
      // Even on error, show success message to prevent email enumeration
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground max-w-[300px]">
            If an account exists for <strong>{submittedEmail}</strong>, we've sent a password reset link.
          </p>
          <p className="text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsSubmitted(false)}
          >
            Try another email
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate({ to: "/login" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Forgot password?"
        description="Enter your email address and we'll send you a reset link"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              className="pl-10"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Reset Link
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
