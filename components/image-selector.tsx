import { RefObject, SyntheticEvent, useState } from 'react';
import { Input } from './ui/input';

export type ImageType = {
  file?: File;
  url: string | '';
};

export default function ImageSelector({
  onSelect,
  children,
  fileElmentRef,
}: {
  onSelect: (image: ImageType) => void;
  children: React.ReactNode;
  fileElmentRef: RefObject<HTMLInputElement | null>;
}) {
  async function handProfilePicChange(evt: SyntheticEvent<HTMLInputElement>) {
    const files = evt.currentTarget.files as FileList | null;
    if (files && files.length > 0) {
      onSelect({ file: files[0], url: URL.createObjectURL(files[0] as Blob) });
    }
  }

  return (
    <>
      {children}
      <Input
        type='file'
        ref={fileElmentRef}
        accept='image/*'
        className='hidden'
        onChange={handProfilePicChange}
      />
    </>
  );
}
