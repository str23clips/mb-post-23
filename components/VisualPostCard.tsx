import React from 'react';
import { DownloadIcon, SparklesIcon } from './Icons';

interface VisualPostCardProps {
  imageUrl: string;
  productName: string;
}

export const VisualPostCard: React.FC<VisualPostCardProps> = ({ imageUrl, productName }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `post_visual_${productName.replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 text-primary-600" />
          <h3 className="font-semibold text-gray-800">Arte Gerada</h3>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
        >
          <DownloadIcon className="w-4 h-4" />
          Baixar
        </button>
      </div>
      <div className="p-4 bg-gray-100 flex justify-center">
        <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-md">
            <img 
              src={imageUrl} 
              alt={`Arte gerada para ${productName}`} 
              className="w-full h-full object-cover" 
            />
        </div>
      </div>
    </div>
  );
};