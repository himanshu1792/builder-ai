"use client";

interface DeleteDialogProps {
  applicationId: string;
  applicationName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteDialog({
  isOpen,
}: DeleteDialogProps) {
  if (!isOpen) return null;
  return null;
}
