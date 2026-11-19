import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { updateUserProfilePhotoAction } from "@/actions/userActions";
import { useUserStore } from "@/store/userStore";

interface UseProfilePhotoUploadOptions {
  messages: {
    invalidImageToast: string;
    imageSizeToast: string;
    photoSuccessToast: string;
    photoErrorToast: string;
  };
  disabled?: boolean;
}

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export function useProfilePhotoUpload({
  messages,
  disabled = false,
}: UseProfilePhotoUploadOptions) {
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const committedBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (
        previewUrl?.startsWith("blob:") &&
        previewUrl !== committedBlobUrlRef.current
      ) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(messages.invalidImageToast);
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error(messages.imageSizeToast);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:") && prev !== committedBlobUrlRef.current) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const res = await updateUserProfilePhotoAction(formData);
      if (res.success) {
        toast.success(messages.photoSuccessToast);
        if (
          committedBlobUrlRef.current &&
          committedBlobUrlRef.current !== objectUrl
        ) {
          URL.revokeObjectURL(committedBlobUrlRef.current);
        }

        const serverPhotoUrl = res.data?.profilePhotoUrl;
        const resolvedPhotoUrl = serverPhotoUrl ?? objectUrl;
        committedBlobUrlRef.current = serverPhotoUrl ? null : objectUrl;
        setPreviewUrl(resolvedPhotoUrl);

        const hadPreset = Boolean(useUserStore.getState().user?.avatarPreset);
        updateUserPartial({
          profilePhotoUrl: resolvedPhotoUrl,
          ...(hadPreset ? { avatarPreset: null } : {}),
        });
        if (serverPhotoUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      } else {
        toast.error(res.error || messages.photoErrorToast);
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      }
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPending && !disabled) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (isPending || disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const fileInputProps = {
    ref: fileInputRef,
    type: "file" as const,
    accept: "image/*" as const,
    className: "hidden",
    tabIndex: -1,
    onChange: handleFileChange,
  };

  const dropzoneHandlers = {
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  return {
    fileInputRef,
    isPending,
    previewUrl,
    isDraggingOver,
    fileInputProps,
    dropzoneHandlers,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
