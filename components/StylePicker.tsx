'use client';

import { StyleType } from '@/types';
import { STYLES } from '@/lib/images';
import { cn } from '@/lib/utils';

interface StylePickerProps {
  selectedStyle: StyleType | null;
  onStyleSelect: (style: StyleType) => void;
  className?: string;
}

export default function StylePicker({ selectedStyle, onStyleSelect, className }: StylePickerProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STYLES.map((style) => (
          <div
            key={style.id}
            className={cn(
              'border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md',
              selectedStyle === style.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            )}
            onClick={() => onStyleSelect(style.id)}
          >
            <div className="aspect-video rounded-md mb-3 overflow-hidden bg-gray-100">
              <img
                src={`/examples/${style.id}-example.jpg`}
                alt={`${style.name} example`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1 text-sm">{style.name}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{style.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}