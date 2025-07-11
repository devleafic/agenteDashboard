import React, { useState, useRef, useEffect } from 'react';
import { Button, Select, SelectItem, Tooltip } from '@heroui/react';
import { Play, Pause, Download } from 'lucide-react';

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Formatear tiempo en MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Manejar reproducción/pausa
  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Actualizar tiempo actual
  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  // Cargar duración del audio
  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  // Manejar cambio en la barra de progreso
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Manejar cambio de velocidad de reproducción
  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    audioRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  // Sincronizar al finalizar el audio
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(duration); // Asegurar que la barra llegue al 100%
  };

  // Limpiar eventos al desmontar
  useEffect(() => {
    const audio = audioRef.current;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, [duration]);

  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-md border border-gray-200 w-full">
      <Button
        isIconOnly
        variant="solid"
        color="primary"
        onPress={togglePlayPause}
        className="w-8 h-8"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </Button>
      <div className="flex-1 flex items-center space-x-2">
        <input
          type="range"
          min="0"
          max={duration || 1} // Usar 1 como valor predeterminado si duration no está cargado
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600"
        />
        <span className="text-sm text-gray-600 w-16 text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <Select
        aria-label="Velocidad de reproducción"
        size="sm"
        variant="bordered"
        className="w-16"
        classNames={{
          trigger: "h-8 min-h-8",
          value: "text-sm font-medium text-gray-700"
        }}
        selectedKeys={[playbackRate.toString()]}
        onSelectionChange={(keys) => {
          const rate = Array.from(keys)[0];
          if (rate) handlePlaybackRateChange({ target: { value: rate } });
        }}
      >
        <SelectItem key="0.5" value="0.5">0.5x</SelectItem>
        <SelectItem key="1" value="1">1x</SelectItem>
        <SelectItem key="1.5" value="1.5">1.5x</SelectItem>
        <SelectItem key="2" value="2">2x</SelectItem>
      </Select>
      <audio ref={audioRef} src={src} />
      <Tooltip content="Descargar audio" placement="top">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          as="a"
          href={src}
          download
          className="text-gray-500 hover:text-blue-600"
        >
          <Download size={18} />
        </Button>
      </Tooltip>
    </div>
  );
};

export default AudioPlayer;