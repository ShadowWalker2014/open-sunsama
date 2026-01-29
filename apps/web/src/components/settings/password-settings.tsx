// @ts-nocheck
import * as React from "react";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff, Check } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { getApi } from "@/lib/api";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  showPassword: boolean;
  onToggleShow: () => void;
  disabled: boolean;
  error?: string;
  register: ReturnType<typeof useForm<PasswordForm>>["register"];
  registerOptions: Parameters<ReturnType<typeof useForm<PasswordForm>>["register"]>[1];
}

function PasswordInput({
  id,
  label,
  placeholder,
  autoComplete,
  showPassword,
  onToggleShow,
  disabled,
  error,
  register,
  registerOptions,
}: PasswordInputProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          {...register(id as keyof PasswordForm, registerOptions)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={onToggleShow}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export function PasswordSettings() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data: PasswordForm) => {
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
      await api.auth.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      
      reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to change password",
        description:
          error instanceof Error ? error.message : "Could not change password. Please check your current password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <PasswordInput
            id="currentPassword"
            label="Current Password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            showPassword={showCurrentPassword}
            onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            disabled={isLoading}
            error={errors.currentPassword?.message}
            register={register}
            registerOptions={{ required: "Current password is required" }}
          />

          <div className="grid gap-2">
            <PasswordInput
              id="newPassword"
              label="New Password"
              placeholder="Enter your new password"
              autoComplete="new-password"
              showPassword={showNewPassword}
              onToggleShow={() => setShowNewPassword(!showNewPassword)}
              disabled={isLoading}
              error={errors.newPassword?.message}
              register={register}
              registerOptions={{
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
              }}
            />

            {/* Password Requirements */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                {PASSWORD_REQUIREMENTS.map((req, index) => {
                  const passed = req.test(newPassword);
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        passed ? "text-green-600" : "text-muted-foreground"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${passed ? "opacity-100" : "opacity-30"}`}
                      />
                      {req.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            showPassword={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
            error={errors.confirmPassword?.message}
            register={register}
            registerOptions={{
              required: "Please confirm your new password",
              validate: (value) =>
                value === newPassword || "Passwords do not match",
            }}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
