import React, { useCallback, useRef } from 'react';
import { UploadIcon, XCircleIcon, PlusIcon } from './Icons';

interface ImageUploaderProps {
  onFileChange: (files: FileList) => void;
  previewUrls: string[];
  onRemoveFile: (index: number) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileChange, previewUrls, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files);
      // Reseta o valor para permitir o upload do mesmo arquivo novamente
      e.target.value = '';
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
      onFileChange(e.dataTransfer.files);
    }
  }, [onFileChange]);
  
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
        multiple
      />
      {previewUrls.length === 0 ? (
        <label
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className="mt-1 flex justify-center items-center w-full h-64 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-primary-500 transition-colors bg-white relative overflow-hidden"
        >
          <div className="space-y-1 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <p className="pl-1">Clique para enviar ou arraste e solte</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP (múltiplos arquivos)</p>
          </div>
        </label>
      ) : (
        <div className="mt-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative group aspect-square">
              <img
                src={url}
                alt={`Pré-visualização ${index + 1}`}
                className="w-full h-full object-cover rounded-md border border-gray-200"
              />
              <button
                onClick={() => onRemoveFile(index)}
                className="absolute top-1 right-1 bg-gray-800 bg-opacity-60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Remover imagem"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button
            onClick={handleClick}
            className="flex flex-col justify-center items-center w-full aspect-square border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-primary-500 transition-colors bg-gray-50 text-gray-500 hover:text-primary-600"
            aria-label="Adicionar mais imagens"
          >
            <PlusIcon className="w-8 h-8" />
            <span className="text-xs mt-1 font-medium">Adicionar</span>
          </button>
        </div>
      )}
    </div>
  );
};