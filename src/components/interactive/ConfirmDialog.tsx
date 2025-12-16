import { ConfirmModal } from "@/components/Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog - Backward compatibility wrapper for ConfirmModal
 * @deprecated Use ConfirmModal directly from @/components/Modal instead
 */
export default function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <ConfirmModal
      isOpen={props.isOpen}
      onClose={props.onCancel}
      onConfirm={props.onConfirm}
      title={props.title}
      message={props.message}
      confirmText={props.confirmText}
      cancelText={props.cancelText}
      variant={props.variant}
    />
  );
}
