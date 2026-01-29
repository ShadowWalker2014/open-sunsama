import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout, AuthHeader, AuthFooter } from "@/components/layout/auth-layout";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "@/hooks/use-toast";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch("password");

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/app" });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate({ to: "/app" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description:
          error instanceof Error ? error.message : "Could not create account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader
        title="Create an account"
        description="Enter your details below to create your account"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            disabled={isLoading}
            {...register("name", {
              required: "Name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button variant="outline" type="button" disabled={isLoading}>
        Continue with Google
      </Button>

      <AuthFooter>
        Already have an account?{" "}
        <Link
          to="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </AuthFooter>
    </AuthLayout>
  );
}

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
