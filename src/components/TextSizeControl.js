import React from 'react';
import { Button, Tooltip } from '@heroui/react';
import { useTextSize, TEXT_SIZES } from '../contexts/TextSizeContext';

// Iconos para los diferentes tamaños de texto - diseño moderno y limpio
const TextSmallIcon = (props) => (
  <div className="flex items-center justify-center w-5 h-5" {...props}>
    <span className="text-xs font-semibold">A</span>
  </div>
);

const TextMediumIcon = (props) => (
  <div className="flex items-center justify-center w-5 h-5" {...props}>
    <span className="text-sm font-semibold">A</span>
  </div>
);

const TextLargeIcon = (props) => (
  <div className="flex items-center justify-center w-5 h-5" {...props}>
    <span className="text-base font-bold">A</span>
  </div>
);

const TextSizeControl = () => {
  const { textSize, cycleTextSize } = useTextSize();
  
  // Determinar qué icono mostrar según el tamaño actual
  const getIcon = () => {
    switch (textSize) {
      case TEXT_SIZES.SMALL:
        return <TextSmallIcon className="w-5 h-5" />;
      case TEXT_SIZES.MEDIUM:
        return <TextMediumIcon className="w-5 h-5" />;
      case TEXT_SIZES.LARGE:
        return <TextLargeIcon className="w-5 h-5" />;
      default:
        return <TextMediumIcon className="w-5 h-5" />;
    }
  };

  // Obtener el texto del tooltip según el tamaño actual
  const getTooltipText = () => {
    switch (textSize) {
      case TEXT_SIZES.SMALL:
        return "Tamaño de texto: Pequeño (clic para cambiar)";
      case TEXT_SIZES.MEDIUM:
        return "Tamaño de texto: Mediano (clic para cambiar)";
      case TEXT_SIZES.LARGE:
        return "Tamaño de texto: Grande (clic para cambiar)";
      default:
        return "Cambiar tamaño de texto";
    }
  };

  return (
    <Tooltip content={getTooltipText()}>
      <Button
        isIconOnly
        variant="flat"
        size="sm"
        aria-label="Cambiar tamaño de texto"
        onPress={cycleTextSize}
        className="bg-gradient-to-br from-indigo-500 to-pink-500 border-small border-white/50 shadow-pink-500/30 text-white hover:opacity-90 transition-opacity"
      >
        {getIcon()}
      </Button>
    </Tooltip>
  );
};

export default TextSizeControl;
