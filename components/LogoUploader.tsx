import React, { useCallback, useRef } from 'react';
import { PhotoIcon, XCircleIcon } from './Icons';

interface LogoUploaderProps {
  onLogoChange: (file: File) => void;
  logoPreviewUrl: string | null;
  onRemoveLogo: () => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ onLogoChange, logoPreviewUrl, onRemoveLogo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onLogoChange(e.target.files[0]);
      e.target.value = ''; // Reset for re-uploading the same file
    }
  };
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onLogoChange(e.dataTransfer.files[0]);
    }
  }, [onLogoChange]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
      {!logoPreviewUrl ? (
        <label
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className="mt-1 flex justify-center items-center w-full h-32 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-primary-500 transition-colors bg-white"
        >
          <div className="space-y-1 text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <p className="pl-1">Clique para enviar ou arraste e solte</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG (fundo transparente recomendado)</p>
          </div>
        </label>
      ) : (
        <div className="mt-1 relative group w-40 h-40 p-2 border border-gray-200 rounded-md bg-white">
          <img
            src={logoPreviewUrl}
            alt="Pré-visualização da logo"
            className="w-full h-full object-contain"
          />
          <button
            onClick={onRemoveLogo}
            className="absolute top-1 right-1 bg-gray-800 bg-opacity-60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Remover logo"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};