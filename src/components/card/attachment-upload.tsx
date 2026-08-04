import { useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Attachment01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@components/ui/button';
import type { ChangeEvent, FC, ReactElement } from 'react';

type AttachmentUploadProps = {
  uploading?: boolean;
  onUpload: (file: File) => void;
};

export function AttachmentUpload({ uploading = false, onUpload }: AttachmentUploadProps): ReactElement<FC> {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];

    if (file != null) onUpload(file);

    // Reset so selecting the same file again re-fires change.
    e.target.value = '';
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={(): void => inputRef.current?.click()}
      >
        <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} className="size-4" />
        {uploading ? 'Uploading…' : 'Attach file'}
      </Button>
    </>
  );
}
