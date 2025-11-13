import React, { useState } from 'react';
import { CopyIcon, CheckIcon, InstagramIcon, FacebookIcon, TwitterIcon } from './Icons';

interface PostCardProps {
  platform: 'Instagram' | 'Facebook' | 'Twitter';
  content: string;
  title?: string;
}

const platformIcons: { [key in PostCardProps['platform']]: React.ReactNode } = {
  Instagram: <InstagramIcon className="w-6 h-6" />,
  Facebook: <FacebookIcon className="w-6 h-6" />,
  Twitter: <TwitterIcon className="w-6 h-6" />,
};

export const PostCard: React.FC<PostCardProps> = ({ platform, content, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {platformIcons[platform]}
          <h3 className="font-semibold text-gray-800">{title || platform}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4 text-green-500" />
              Copiado!
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4" />
              Copiar
            </>
          )}
        </button>
      </div>
      <div className="p-4 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
};
