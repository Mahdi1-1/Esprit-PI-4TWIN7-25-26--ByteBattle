import React from 'react';
import { EXPRESSIONS, RPMExpression } from '../../types/avatar.types';

interface Props {
  current?: string;
  onChange: (expr: RPMExpression) => void;
  disabled?: boolean;
}

export const ExpressionSelector: React.FC<Props> = ({ current = 'neutral', onChange, disabled }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-2">
      {EXPRESSIONS.map((expr) => (
        <button
          key={expr.id}
          onClick={() => onChange(expr.id as RPMExpression)}
          disabled={disabled}
          className={`
            flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all
            ${current === expr.id 
              ? 'bg-blue-600/20 border-blue-500 border' 
              : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span className="text-2xl">{expr.emoji}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{expr.label}</span>
        </button>
      ))}
    </div>
  );
};
