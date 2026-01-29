import { Check } from "lucide-react";

export const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
  { label: "One uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
  { label: "One lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
  { label: "One number", test: (pwd: string) => /[0-9]/.test(pwd) },
];

interface PasswordRequirementsListProps {
  password: string;
}

export function PasswordRequirementsList({ password }: PasswordRequirementsListProps) {
  if (!password) return null;
  
  return (
    <div className="mt-2 space-y-1">
      {PASSWORD_REQUIREMENTS.map((req, index) => {
        const passed = req.test(password);
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
  );
}
