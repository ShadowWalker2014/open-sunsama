import * as React from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Loader2, KeyRound } from "lucide-react";
import { startAuthentication, browserSupportsWebAuthnAutofill, WebAuthnAbortService } from "@simplewebauthn/browser";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout, AuthHeader, AuthFooter } from "@/components/layout/auth-layout";
import { Button, Input, Label } from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { getSafeRedirect } from "@/lib/auth-redirect";
import { getApi } from "@/lib/api";
import { supportsPasskeys, passkeyError } from "@/lib/passkeys";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  useSEO(SEO_CONFIGS.login);
  const navigate = useNavigate();
  const redirect = React.useMemo(getSafeRedirect, []);
  const goNext = React.useCallback(() => {
    if (redirect) void navigate({ href: redirect, replace: true });
    else void navigate({ to: "/app" });
  }, [navigate, redirect]);
  const { login, completePasskeyLogin, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);
  const [passkeysSupported] = React.useState(supportsPasskeys);
  const ceremonyVersion = React.useRef(0);

  React.useEffect(() => {
    if (!passkeysSupported || isAuthenticated) return;
    let active = true;
    const version = ++ceremonyVersion.current;
    const isCurrent = () => active && version === ceremonyVersion.current;
    // Conditional mediation waits quietly for a passkey selected in autofill.
    void (async () => {
      if (!await browserSupportsWebAuthnAutofill() || !isCurrent()) return;
      const { options, challengeId } = await getApi().auth.passkeyLoginOptions();
      if (!isCurrent()) return;
      const response = await startAuthentication({ optionsJSON: options, useBrowserAutofill: true });
      if (!isCurrent()) return;
      const data = await getApi().auth.verifyPasskeyLogin({ challengeId, response });
      if (isCurrent()) completePasskeyLogin(data);
    })().catch(() => {
      // Autofill is optional; explicit passkey and password sign-in remain usable.
    });
    return () => {
      active = false;
      WebAuthnAbortService.cancelCeremony();
    };
  }, [passkeysSupported, isAuthenticated, completePasskeyLogin]);

  const signInWithPasskey = async () => {
    ++ceremonyVersion.current;
    WebAuthnAbortService.cancelCeremony();
    setIsPasskeyLoading(true);
    try {
      const { options, challengeId } = await getApi().auth.passkeyLoginOptions();
      const response = await startAuthentication({ optionsJSON: options });
      completePasskeyLogin(await getApi().auth.verifyPasskeyLogin({ challengeId, response }));
    } catch (error) {
      toast({ variant: "destructive", title: "Passkey sign-in failed", description: passkeyError(error) });
    } finally {
      setIsPasskeyLoading(false);
    }
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      goNext();
    }
  }, [isAuthenticated, goNext]);

  const onSubmit = async (data: LoginForm) => {
    ++ceremonyVersion.current;
    WebAuthnAbortService.cancelCeremony();
    setIsLoading(true);
    try {
      await login(data);
      goNext();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader
        title="Sign in"
        description={passkeysSupported ? "Use your password or a passkey to continue" : "Enter your email and password"}
      />

      <form id="login-form" autoComplete="on" onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="username webauthn"
            autoCorrect="off"
            readOnly={isLoading || isPasskeyLoading}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            readOnly={isLoading || isPasskeyLoading}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading || isPasskeyLoading} className="w-full mt-2 h-9 text-[13px]">
          {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Sign in
        </Button>
      </form>

      {passkeysSupported && (
        <Button type="button" variant="outline" disabled={isLoading || isPasskeyLoading} onClick={signInWithPasskey} className="mt-3 w-full">
          {isPasskeyLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <KeyRound className="mr-1.5 h-3.5 w-3.5" />}
          Sign in with a passkey
        </Button>
      )}

      <AuthFooter>
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          search={redirect ? { redirect } : undefined}
          className="text-foreground hover:underline underline-offset-4"
        >
          Sign up
        </Link>
      </AuthFooter>
    </AuthLayout>
  );
}
