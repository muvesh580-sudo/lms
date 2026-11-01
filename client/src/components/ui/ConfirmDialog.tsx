import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Used instead of window.confirm, which some browsers block and silently answer "no"
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  disabled = false,
  onConfirm,
  onCancel,
}) => (
  <Dialog open={open} onClose={onCancel} className="relative z-50">
    <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" disabled={disabled} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" disabled={disabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
);

export default ConfirmDialog;
