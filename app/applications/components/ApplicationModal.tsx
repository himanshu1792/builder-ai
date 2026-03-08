"use client";

import type { ApplicationView } from "@/lib/applications";

interface ApplicationModalProps {
  mode: "create" | "edit";
  application?: ApplicationView;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicationModal({
  isOpen,
}: ApplicationModalProps) {
  if (!isOpen) return null;
  return null;
}
