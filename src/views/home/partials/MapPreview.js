import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '@heroui/react';

// Iconos
const ExclamationCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const MapIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

// Función para generar una clave única para el caché basada en las coordenadas
const getCacheKey = (lat, lng, zoom = 15, size = '600x300') => {
    return `map_${lat}_${lng}_${zoom}_${size}`;
};

// Función para guardar en caché
const saveToCache = (key, data) => {
    try {
        const cacheData = {
            data,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Error al guardar en caché:', error);
    }
};

// Función para cargar del caché
const loadFromCache = (key, maxAgeHours = 24) => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const now = new Date().getTime();
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000; // Convertir horas a milisegundos
        
        if (now - timestamp > maxAgeMs) {
            // Eliminar datos caducados
            localStorage.removeItem(key);
            return null;
        }
        
        return data;
    } catch (error) {
        console.warn('Error al cargar del caché:', error);
        return null;
    }
};

const MapPreview = ({ lat, lng }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);
    const [cachedImage, setCachedImage] = useState(null);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const apiKey = process.env.REACT_APP_MAPS_APIKEY;
    const cacheKey = getCacheKey(lat, lng);

    // Efecto para cargar desde caché o generar la URL del mapa
    useEffect(() => {
        console.log('MapPreview - API Key:', apiKey ? 'Presente' : 'Faltante');
        console.log('Coordenadas:', { lat, lng });

        // Verificar primero en caché
        const cachedData = loadFromCache(cacheKey);
        if (cachedData) {
            console.log('Usando imagen en caché para:', cacheKey);
            setCachedImage(cachedData);
            setImageLoaded(true);
            return;
        }
        
        // Si no hay en caché, verificar la API
        if (apiKey) {
            console.log('Solicitando imagen del mapa a la API...');
            const testUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
            
            // Usar fetch para obtener la imagen y convertirla a base64 para el caché
            fetch(testUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        // Guardar en caché
                        saveToCache(cacheKey, base64data);
                        setCachedImage(base64data);
                        setImageLoaded(true);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(error => {
                    console.error('Error al cargar el mapa:', error);
                    setErrorDetails(error.message);
                    setImageError(true);
                });
        }
    }, [apiKey, lat, lng, cacheKey]);
    
    if (!apiKey) {
        return (
            <Card className="w-full overflow-hidden border border-hair">
                <CardBody className="p-4">
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                        <ExclamationCircleIcon className="w-12 h-12 text-warn mb-2" />
                        <p className="font-medium">No se puede mostrar el mapa</p>
                        <p className="text-sm text-ink-600 mt-1">Falta la configuración de la API de Google Maps</p>
                        <p className="text-xs text-ink-500 mt-2">Agrega REACT_APP_MAPS_APIKEY en tu archivo .env</p>
                        <Button 
                            className="mt-3" 
                            size="sm" 
                            color="primary" 
                            variant="flat"
                            onPress={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
                        >
                            Ver en Google Maps
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // Usar la imagen en caché o generar la URL
    const mapUrl = cachedImage || `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
    
    // Función para manejar errores de carga de imagen
    const handleImageError = (error) => {
        console.error('Error al cargar la imagen del mapa:', error);
        setImageError(true);
        
        // Si falla la imagen en caché, intentar cargarla directamente
        if (cachedImage) {
            console.log('Falló la carga de la imagen en caché, intentando cargar directamente...');
            setCachedImage(null);
            localStorage.removeItem(cacheKey); // Eliminar caché corrupto
        }
    };
    
    // Función para forzar la actualización del mapa
    const handleRefreshMap = () => {
        // Eliminar del caché y forzar recarga
        localStorage.removeItem(cacheKey);
        setCachedImage(null);
        setImageLoaded(false);
        setImageError(false);
        setErrorDetails(null);
    };

    return (
        <Card className="w-full overflow-hidden border border-hair">
            <CardBody className="p-0">
                <div 
                    className="relative w-full h-48 bg-cream-100 hover:opacity-90 transition-opacity cursor-pointer group"
                    onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
                >
                    {!imageError ? (
                        <>
                            <img 
                                src={cachedImage || mapUrl} 
                                alt="Ubicación en el mapa" 
                                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={handleImageError}
                                crossOrigin={cachedImage ? undefined : "anonymous"}
                            />
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream-100">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-info mb-2"></div>
                                    <p className="text-xs text-ink-500 mt-2">Cargando mapa...</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-cream-100 p-4 text-center">
                            <ExclamationCircleIcon className="w-12 h-12 text-warn mb-2" />
                            <p className="font-medium text-ink-600">No se pudo cargar la vista previa</p>
                            <p className="text-sm text-ink-500 mt-1">La ubicación está disponible pero no se puede mostrar el mapa</p>
                            {errorDetails && (
                                <p className="text-xs text-ink-400 mt-2">{errorDetails}</p>
                            )}
                            <Button 
                                className="mt-3" 
                                size="sm" 
                                color="primary" 
                                variant="flat"
                                onPress={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
                            >
<MapIcon className="w-4 h-4 mr-1" />
                                Ver en Google Maps
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRefreshMap();
                                    }}
                                    className="ml-2 text-xs text-cream/70 hover:text-cream transition-colors"
                                    title="Actualizar mapa"
                                >
                                    ⟳
                                </button>
                            </Button>
                        </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/80 to-transparent p-3">
                        <div className="flex items-center justify-between text-cream">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm font-medium">Ver en Google Maps</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default MapPreview;