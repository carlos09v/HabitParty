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

  const activePreviewBlobRef = useRef<string | null>(null);
  const committedBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      const currentBlob = activePreviewBlobRef.current;
      if (
        currentBlob?.startsWith("blob:") &&
        currentBlob !== committedBlobUrlRef.current
      ) {
        URL.revokeObjectURL(currentBlob);
      }
    };
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(messages.invalidImageToast);
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error(messages.imageSizeToast);
      return;
    }

    const previousBlob = activePreviewBlobRef.current;
    if (
      previousBlob?.startsWith("blob:") &&
      previousBlob !== committedBlobUrlRef.current
    ) {
      URL.revokeObjectURL(previousBlob);
    }

    const objectUrl = URL.createObjectURL(file);
    activePreviewBlobRef.current = objectUrl;
    setPreviewUrl(objectUrl);

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

        const hadPreset = Boolean(useUserStore.getState().user?.avatarPreset);
        updateUserPartial({
          profilePhotoUrl: resolvedPhotoUrl,
          ...(hadPreset ? { avatarPreset: null } : {}),
        });

        // Limpa previewUrl assim que a URL definitiva é gravada no store,
        // evitando mascarar presets simbólicos equipados logo em seguida.
        if (serverPhotoUrl) {
          activePreviewBlobRef.current = null;
          setPreviewUrl(null);
          URL.revokeObjectURL(objectUrl);
        } else {
          setPreviewUrl(objectUrl);
        }
      } else {
        toast.error(res.error || messages.photoErrorToast);
        URL.revokeObjectURL(objectUrl);
        if (activePreviewBlobRef.current === objectUrl) {
          activePreviewBlobRef.current = null;
        }
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
  };
}
