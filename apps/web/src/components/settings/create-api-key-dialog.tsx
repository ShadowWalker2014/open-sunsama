import * as React from "react";
import type { CreateApiKeyInput, CreateApiKeyResponse } from "@chronoflow/types";
import { ApiKeyCreatedView } from "./api-key-created-view";
import { ApiKeyForm } from "./api-key-form";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateApiKeyInput) => Promise<CreateApiKeyResponse>;
  isLoading?: boolean;
}

/**
 * Dialog for creating a new API key
 * Two-phase flow: input form -> key display
 */
export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateApiKeyDialogProps) {
  const [createdKey, setCreatedKey] = React.useState<CreateApiKeyResponse | null>(null);

  const handleFormSubmit = async (data: CreateApiKeyInput) => {
    try {
      const response = await onSubmit(data);
      setCreatedKey(response);
    } catch (_error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation completes
    setTimeout(() => {
      setCreatedKey(null);
    }, 200);
  };

  // Show key display if key was created
  if (createdKey) {
    return (
      <ApiKeyCreatedView
        open={open}
        createdKey={createdKey}
        onClose={handleClose}
      />
    );
  }

  // Show creation form
  return (
    <ApiKeyForm
      open={open}
      isLoading={isLoading}
      onClose={handleClose}
      onSubmit={handleFormSubmit}
    />
  );
}
