import React from "react";

export const MatrixSpinner: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center p-2 rounded-full border border-green-500 bg-black/80 shadow-[0_0_15px_rgba(0,255,0,0.4)] animate-spin duration-1000">
      <span className="font-mono text-[10px] text-green-400 font-bold select-none">
        ☠
      </span>
    </div>
  );
};

export default MatrixSpinner;
