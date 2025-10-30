import toast from 'react-hot-toast';

export function useToast() {
  return {
    success: (message: string) => {
      toast.success(message);
    },
    error: (message: string) => {
      toast.error(message);
    },
    loading: (message: string) => {
      return toast.loading(message);
    },
    dismiss: (toastId?: string) => {
      toast.dismiss(toastId);
    },
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      }
    ) => {
      return toast.promise(promise, messages);
    },
  };
}

// También exportamos toast directamente para casos avanzados
export { toast };
