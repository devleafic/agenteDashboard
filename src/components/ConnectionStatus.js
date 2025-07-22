import React, { useState, useEffect } from 'react';
import { Tooltip, Badge } from '@heroui/react';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [connectionSpeed, setConnectionSpeed] = useState('');

    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine);
            if (navigator.onLine) {
                checkConnectionSpeed();
            }
        };

        const checkConnectionSpeed = () => {
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (connection) {
                    setConnectionSpeed(getSpeedLabel(connection.downlink));
                    connection.addEventListener('change', handleConnectionChange);
                }
            }
        };

        const handleConnectionChange = () => {
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (connection) {
                    setConnectionSpeed(getSpeedLabel(connection.downlink));
                }
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        updateOnlineStatus();
        const interval = setInterval(checkConnectionSpeed, 30000);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (connection) {
                    connection.removeEventListener('change', handleConnectionChange);
                }
            }
            clearInterval(interval);
        };
    }, []);

    const getSpeedLabel = (downlink) => {
        if (!downlink) return 'Verificando...';
        const speedMbps = Math.round(downlink * 10) / 10;
        if (speedMbps > 5) return 'Excelente';
        if (speedMbps > 2) return 'Buena';
        if (speedMbps > 0.5) return 'Regular';
        return 'Mala';
    };

    const getStatusColor = () => {
        if (!isOnline) return 'danger';
        const speed = getSpeedLabel(navigator.connection?.downlink);
        switch(speed) {
            case 'Excelente': return 'success';
            case 'Buena': return 'primary';
            case 'Regular': return 'warning';
            case 'Mala': return 'danger';
            default: return 'default';
        }
    };

    const getTooltipContent = () => {
        if (!isOnline) return 'Sin conexión a Internet';
        const speed = getSpeedLabel(navigator.connection?.downlink);
        return `Calidad de conexión: ${speed}`;
    };

    return (
        <Tooltip content={getTooltipContent()} placement="bottom">
            <div className="flex items-center gap-2 p-1 rounded-full">
                {isOnline ? (
                    <Badge color={getStatusColor()} content="" shape="circle" size="sm">
                        <Wifi className={`w-5 h-5 text-${getStatusColor()}-500`} />
                    </Badge>
                ) : (
                     <Badge color="danger" content="" shape="circle" size="sm">
                        <WifiOff className="w-5 h-5 text-danger-500" />
                    </Badge>
                )}
            </div>
        </Tooltip>
    );
};

export default ConnectionStatus;
