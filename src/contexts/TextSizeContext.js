import React, { createContext, useState, useContext, useEffect } from 'react';

// Valores predefinidos para tamaños de texto
export const TEXT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

// Mapeo de tamaños a valores CSS
export const TEXT_SIZE_VALUES = {
  [TEXT_SIZES.SMALL]: '0.875rem', // 14px
  [TEXT_SIZES.MEDIUM]: '1rem',    // 16px (default)
  [TEXT_SIZES.LARGE]: '1.125rem'  // 18px
};

const TextSizeContext = createContext();

export const TextSizeProvider = ({ children }) => {
  // Intentar recuperar el tamaño guardado del localStorage, o usar el tamaño medio por defecto
  const [textSize, setTextSize] = useState(() => {
    const savedSize = localStorage.getItem('conversationTextSize');
    return savedSize && Object.values(TEXT_SIZES).includes(savedSize) 
      ? savedSize 
      : TEXT_SIZES.MEDIUM;
  });

  // Guardar el tamaño en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('conversationTextSize', textSize);
  }, [textSize]);

  // Cambiar al siguiente tamaño en la secuencia
  const cycleTextSize = () => {
    setTextSize(currentSize => {
      switch (currentSize) {
        case TEXT_SIZES.SMALL:
          return TEXT_SIZES.MEDIUM;
        case TEXT_SIZES.MEDIUM:
          return TEXT_SIZES.LARGE;
        case TEXT_SIZES.LARGE:
          return TEXT_SIZES.SMALL;
        default:
          return TEXT_SIZES.MEDIUM;
      }
    });
  };

  // Establecer un tamaño específico
  const setSpecificTextSize = (size) => {
    if (Object.values(TEXT_SIZES).includes(size)) {
      setTextSize(size);
    }
  };

  return (
    <TextSizeContext.Provider value={{ 
      textSize, 
      textSizeValue: TEXT_SIZE_VALUES[textSize], 
      cycleTextSize,
      setTextSize: setSpecificTextSize
    }}>
      {children}
    </TextSizeContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useTextSize = () => {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize debe usarse dentro de un TextSizeProvider');
  }
  return context;
};
