import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LogoUploader } from './components/LogoUploader';
import { PostCard } from './components/PostCard';
import { VisualPostCard } from './components/VisualPostCard';
import { Loader } from './components/Loader';
import { SparklesIcon, XCircleIcon } from './components/Icons';
import { GeneratedPosts } from './types';
import { generateAllPosts, recognizeProductInImage } from './services/geminiService';
import { Part } from '@google/genai';

const App: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [promotion, setPromotion] = useState('');
  const [style, setStyle] = useState('');
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPosts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecognizingProduct, setIsRecognizingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        }
      };
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  useEffect(() => {
    // Limpa as URLs de preview quando os componentes são desmontados para evitar memory leaks
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [previewUrls, logoPreviewUrl]);

  const handleFileChange = useCallback(async (addedFiles: FileList) => {
    const newFiles = Array.from(addedFiles);
    if (newFiles.length === 0) return;

    const shouldRecognizeProduct = imageFiles.length === 0;

    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setImageFiles(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setGeneratedPosts(null);
    setError(null);

    if (shouldRecognizeProduct) {
      setIsRecognizingProduct(true);
      try {
        const imagePart = await fileToGenerativePart(newFiles[0]);
        const recognizedName = await recognizeProductInImage([imagePart]);
        setProductName(recognizedName);
      } catch (err)
        {
        console.error("Erro ao reconhecer produto:", err);
      } finally {
        setIsRecognizingProduct(false);
      }
    }
  }, [imageFiles.length]);

  const handleLogoChange = useCallback((file: File) => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  }, [logoPreviewUrl]);

  const handleRemoveLogo = useCallback(() => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(null);
    setLogoPreviewUrl(null);
  }, [logoPreviewUrl]);


  const handleRemoveFile = useCallback((indexToRemove: number) => {
    // Revoga a URL do objeto para liberar memória
    URL.revokeObjectURL(previewUrls[indexToRemove]);

    const newImageFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    const newPreviewUrls = previewUrls.filter((_, index) => index !== indexToRemove);

    setImageFiles(newImageFiles);
    setPreviewUrls(newPreviewUrls);

    if (newImageFiles.length === 0) {
      setProductName('');
    }
  }, [imageFiles, previewUrls]);

  const handleSubmit = async () => {
    if (imageFiles.length === 0) {
      setError('Por favor, faça o upload de pelo menos uma imagem do produto.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPosts(null);

    try {
      const imageParts = await Promise.all(imageFiles.map(file => fileToGenerativePart(file)));
      const logoPart = logoFile ? await fileToGenerativePart(logoFile) : null;
      
      const posts = await generateAllPosts(imageParts, logoPart, {
        productName,
        price,
        targetAudience,
        promotion,
        style,
      });
      setGeneratedPosts(posts);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao gerar os posts. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const canGenerate = imageFiles.length > 0 && !isLoading;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              MB POST
            </h1>
          </div>
          <p className="text-gray-500 mt-1">Crie uma arte e legendas para Instagram, Facebook e Twitter a partir de uma foto.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Coluna de Controles */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">1. Imagem do Produto</h2>
              <p className="text-sm text-gray-500 mb-3">Envie uma ou mais fotos claras do seu produto.</p>
              <ImageUploader 
                onFileChange={handleFileChange} 
                previewUrls={previewUrls}
                onRemoveFile={handleRemoveFile}
              />
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-800">2. Sua Logo (Opcional)</h2>
              <p className="text-sm text-gray-500 mb-3">Sua logo será adicionada na arte gerada.</p>
              <LogoUploader 
                onLogoChange={handleLogoChange}
                logoPreviewUrl={logoPreviewUrl}
                onRemoveLogo={handleRemoveLogo}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800">3. Detalhes do Post</h2>
              <p className="text-sm text-gray-500 mb-3">Forneça mais contexto para um resultado melhor.</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                    {isRecognizingProduct && <span className="text-xs text-primary-600 animate-pulse">Reconhecendo...</span>}
                  </div>
                  <input
                    type="text"
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    disabled={isRecognizingProduct}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                    placeholder="Será preenchido pela IA..."
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="99,90"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-700">Estilo da Arte</label>
                  <input
                    type="text"
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Ex: Minimalista com cores vibrantes, neon, retrô"
                  />
                </div>
                 <div>
                  <label htmlFor="promotion" className="block text-sm font-medium text-gray-700">Promoção ou Texto de Destaque</label>
                  <input
                    type="text"
                    id="promotion"
                    value={promotion}
                    onChange={(e) => setPromotion(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Ex: 20% OFF, Frete Grátis, Lançamento"
                  />
                </div>
                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">Público-alvo (para as legendas)</label>
                  <input
                    type="text"
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Ex: Amantes de cerveja, jovens adultos"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canGenerate}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader /> : <SparklesIcon className="w-5 h-5" />}
              {isLoading ? 'Gerando...' : 'Gerar Posts'}
            </button>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center gap-3">
                <XCircleIcon className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Coluna de Resultados */}
          <div className="space-y-6">
             <h2 className="text-lg font-semibold text-gray-800">4. Resultados</h2>
             <div className="space-y-4">
              {isLoading && (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow border border-gray-200">
                    <Loader />
                    <p className="mt-4 font-semibold text-primary-700">Analisando o produto e criando a mágica...</p>
                    <p className="text-sm text-gray-500">Isso pode levar alguns segundos.</p>
                  </div>
              )}
               {generatedPosts ? (
                <>
                  {generatedPosts.visualPostUrl && (
                    <VisualPostCard 
                      imageUrl={generatedPosts.visualPostUrl} 
                      productName={productName || 'produto'} 
                    />
                  )}
                  <PostCard 
                    platform="Instagram" 
                    content={generatedPosts.instagram} 
                  />
                  <PostCard 
                    platform="Facebook" 
                    content={generatedPosts.facebook} 
                  />
                   <PostCard 
                    platform="Twitter" 
                    content={generatedPosts.twitter} 
                  />
                </>
              ) : !isLoading && (
                <div className="text-center p-8 bg-white rounded-lg shadow border border-gray-200">
                    <SparklesIcon className="mx-auto w-12 h-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Seus posts aparecerão aqui</h3>
                    <p className="mt-1 text-sm text-gray-500">Preencha as informações ao lado e clique em "Gerar Posts".</p>
                </div>
              )}
             </div>
          </div>
        </div>
      </main>
      <footer className="bg-white mt-12">
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>Powered by Google Gemini API</p>
        </div>
      </footer>
    </div>
  );
};

export default App;