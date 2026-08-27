import React from 'react';
import { ArrowLeftRight, Image as ImageIcon, ShieldAlert, CheckCircle } from 'lucide-react';

interface ImageComparisonCardProps {
  currentUsername: string;
  currentImageUrl?: string | null;
  relatedUsername: string;
  relatedImageUrl?: string | null;
  similarityScore: number; // e.g. 0.87
}

export const ImageComparisonCard: React.FC<ImageComparisonCardProps> = ({
  currentUsername,
  currentImageUrl,
  relatedUsername,
  relatedImageUrl,
  similarityScore
}) => {
  const percentage = Math.round(similarityScore * 100);

  return (
    <div className="cyber-card p-6 bg-slate-950 border-purple-500/40 font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-slate-100">PROFILE IMAGE PERCEPTUAL ANALYSIS</h3>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
          Perceptual dHash Match
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* Current Target Avatar */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-cyan-500/60 p-1 relative overflow-hidden shadow-lg">
            {currentImageUrl ? (
              <img src={currentImageUrl} alt={currentUsername} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-slate-600">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-cyan-400">@{currentUsername}</span>
          <span className="text-[10px] text-slate-500">Current Target</span>
        </div>

        {/* Central Match Badge */}
        <div className="flex flex-col items-center space-y-1 py-2 px-4 rounded-xl bg-slate-900/90 border border-purple-500/30">
          <ArrowLeftRight className="w-6 h-6 text-purple-400 animate-pulse" />
          <span className="text-xl font-black text-purple-300">{percentage}%</span>
          <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Perceptual Similarity</span>
        </div>

        {/* Related Investigation Avatar */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-purple-500/60 p-1 relative overflow-hidden shadow-lg">
            {relatedImageUrl ? (
              <img src={relatedImageUrl} alt={relatedUsername} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-slate-600">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-purple-400">@{relatedUsername}</span>
          <span className="text-[10px] text-slate-500">Related Investigation</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-sans text-purple-200 leading-relaxed">
        <strong className="font-mono text-purple-300">Analysis Summary:</strong> The available profile image is highly similar ({percentage}%) to an image associated with previously investigated profile @{relatedUsername} in the database.
      </div>
    </div>
  );
};
