import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { Mic, MicOff, Phone, PhoneOff, PhoneCall, Save, CheckCircle } from 'react-feather';
import SocketContext from './../../../controladores/SocketContext';
import CallContext from '../../../controladores/CallContext';
import './Call.css';
import './CallComponents.css';

// Componente optimizado para evitar re-renders innecesarios
const CallButton = React.memo(({ 
    icon: Icon, 
    label, 
    onClick, 
    disabled, 
    className = '',
    showPulse = false 
}) => (
    <button
        className={`action-btn ${className} ${disabled ? 'disabled' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
    >
        {showPulse ? (
            <div className="pulse-ring">
                <Icon size={24} />
            </div>
        ) : (
            <Icon size={24} />
        )}
    </button>
));

const Call = React.memo(({ 
    currentFolio, 
    onCall, 
    setOnCall, 
    setRefresh, 
    sidCall, 
    setSidCall,
    onSave,          // Nueva prop para manejar el guardado
    onResolve,       // Nueva prop para manejar la resolución
    isEndingFolio    // Prop para manejar el estado de carga
}) => {
    // Refs para valores que no necesitan causar re-renders
    const callC = useContext(CallContext);
    const socket = useContext(SocketContext);
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [formattedTime, setFormattedTime] = useState('00:00:00');
    const timerRef = useRef(null);
    const lastCallTimeRef = useRef(0);
    const callStartTimeRef = useRef(null);
    const beepRef = useRef(null);
    
    // Función para formatear el tiempo en HH:MM:SS
    const formatTime = useCallback((totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }, []);
    
    // Efecto para actualizar el tiempo formateado
    useEffect(() => {
        setFormattedTime(formatTime(callDuration));
    }, [callDuration, formatTime]);
    
    // Inicializar beep de forma perezosa
    const getBeep = useCallback(() => {
        if (!beepRef.current) {
            beepRef.current = new Audio(`${process.env.REACT_APP_CENTRALITA}/cdn/sound/beepCalling.mp3`);
            beepRef.current.loop = true;
        }
        return beepRef.current;
    }, []);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            const beep = getBeep();
            beep.pause();
            beep.currentTime = 0;
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [getBeep]);

    // Efecto para el temporizador de llamada (optimizado con useRef)
    useEffect(() => {
        if (onCall === 'connect' && !timerRef.current) {
            const startTime = callStartTimeRef.current || Date.now();
            callStartTimeRef.current = startTime;
            
            // Configurar el intervalo para actualizar cada segundo
            timerRef.current = setInterval(() => {
                const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                setCallDuration(elapsedSeconds);
            }, 1000);
        } else if (onCall !== 'connect' && timerRef.current) {
            // Detener el temporizador pero mantener el tiempo mostrado
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        // Limpieza al desmontar
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [onCall]);
    
    // Efecto para inicializar el tiempo si hay una llamada en curso al montar
    useEffect(() => {
        if (onCall === 'connect' && callStartTimeRef.current) {
            const updateTimer = () => {
                const elapsedSeconds = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
                setCallDuration(elapsedSeconds);
            };
            
            // Actualizar inmediatamente
            updateTimer();
            
            // Configurar el intervalo si no existe
            if (!timerRef.current) {
                timerRef.current = setInterval(updateTimer, 1000);
            }
            
            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };
        }
    }, [onCall]);

    // Efecto para el sonido de llamada (optimizado con useCallback)
    useEffect(() => {
        const beep = getBeep();
        
        if (onCall === 'connect' || onCall === 'disconnect') {
            beep.pause();
            beep.currentTime = 0;
        } else if (onCall === 'calling') {
            // Reproducir solo si no está ya reproduciendo
            if (beep.paused) {
                beep.play().catch(e => console.warn('Error playing beep:', e));
            }
        }
    }, [onCall, getBeep]);

    // Funciones de llamada memorizadas
    const hangUp = useCallback(() => {
        const now = Date.now();
        // Evitar múltiples llamadas rápidas
        if (now - lastCallTimeRef.current < 1000) return;
        lastCallTimeRef.current = now;
        
        window.localStorage.setItem('autoAccept', 'false');
        socket.connection.emit('hangUp', { sidCall }, () => {
            setOnCall('disconnect');
            setRefresh(prev => prev + 1);
        });
    }, [sidCall, setOnCall, setRefresh, socket.connection]);

    const makeCall = useCallback(() => {
        const now = Date.now();
        if (now - lastCallTimeRef.current < 1000) return;
        lastCallTimeRef.current = now;
        
        setOnCall('calling');
        window.localStorage.setItem('autoAccept', 'true');
        
        socket.connection.emit('makeCall', {
            folio: currentFolio._id,
            token: window.localStorage.getItem('sdToken')
        }, (data) => {
            if (data && data.call) {
                setSidCall(data.call.sid);
            }
            setRefresh(prev => prev + 1);
        });
    }, [currentFolio._id, setOnCall, setRefresh, setSidCall, socket.connection]);

    const muteCall = useCallback(() => {
        if (callC.connection && callC.connection.activeConnection) {
            const newMutedState = !callC.connection.activeConnection().isMuted();
            callC.connection.activeConnection().mute(newMutedState);
            setIsMuted(newMutedState);
        }
    }, [callC.connection]);

    // Estado para manejar la visibilidad del estado de llamada
    const [callStatus, setCallStatus] = useState({ text: '', className: '', visible: false });
    const statusTimeoutRef = useRef(null);

    // Actualizar el estado de la llamada con animación
    const updateCallStatus = useCallback((newStatus) => {
        // Limpiar timeout anterior si existe
        if (statusTimeoutRef.current) {
            clearTimeout(statusTimeoutRef.current);
        }

        // Iniciar animación de salida
        if (callStatus.text) {
            setCallStatus(prev => ({ ...prev, visible: false }));
        }

        // Configurar el nuevo estado después de que termine la animación de salida
        statusTimeoutRef.current = setTimeout(() => {
            let statusConfig;
            switch (newStatus) {
                case 'connect': 
                    statusConfig = { text: 'Llamada en curso', className: 'connected' };
                    break;
                case 'disconnect': 
                    statusConfig = { text: 'Llamada finalizada', className: 'disconnected' };
                    break;
                case 'calling': 
                    statusConfig = { text: 'Llamando...', className: 'calling' };
                    break;
                default: 
                    statusConfig = { text: '', className: '' };
            }
            setCallStatus({ ...statusConfig, visible: true });
            
            // Ocultar automáticamente después de 3 segundos si es un estado de desconexión
            if (newStatus === 'disconnect') {
                statusTimeoutRef.current = setTimeout(() => {
                    setCallStatus(prev => ({ ...prev, visible: false }));
                }, 3000);
            }
        }, 200); // Tiempo para la animación de salida
    }, [callStatus.text]);

    // Efecto para actualizar el estado cuando cambia onCall
    useEffect(() => {
        if (onCall) {
            updateCallStatus(onCall);
        }
        return () => {
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
            }
        };
    }, [onCall, updateCallStatus]);

    // El tiempo formateado ahora se maneja con el estado formatedTimeState
    // que se actualiza en el efecto con la función formatTime

    // Punto de estado de llamada
    const statusDot = useMemo(() => (
        callStatus.className === 'connected' && <span className="status-dot"></span>
    ), [callStatus.className]);

    // Obtener iniciales para el avatar
    const initials = useMemo(() => {
        if (!currentFolio?.person?.anchor) return '?';
        return currentFolio.person.anchor
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }, [currentFolio?.person?.anchor]);

    return (
        <div className="call-container">
            {callStatus.text && (
                <div 
                    className={`call-status ${callStatus.className} ${callStatus.visible ? 'visible' : 'exiting'}`}
                    key={`status-${callStatus.className}`}
                >
                    {statusDot}
                    {callStatus.text}
                </div>
            )}

            <div className="caller-info">
                <div className="caller-avatar" aria-hidden="true">
                    {initials}
                </div>
                <h2>{currentFolio?.person?.anchor || 'Contacto'}</h2>
                <p className="caller-number">
                    {currentFolio?.person?.anchor || currentFolio?.from || currentFolio?.phone || 'Número no disponible'}
                </p>
                
                {(onCall === 'connect' || onCall === 'disconnect') && (
                    <div className="call-timer-container">
                        <div className="call-timer">
                            {formattedTime}
                        </div>
                        <div className="call-timer-label">
                            Duración de la llamada
                        </div>
                    </div>
                )}
            </div>

            <div className="call-actions">
                <CallButton
                    icon={isMuted ? MicOff : Mic}
                    label={isMuted ? 'Activar micrófono' : 'Silenciar'}
                    onClick={muteCall}
                    disabled={onCall !== 'connect'}
                    className={isMuted ? 'active' : ''}
                />
                
                <CallButton
                    icon={PhoneOff}
                    label="Colgar"
                    onClick={hangUp}
                    disabled={onCall === 'disconnect'}
                    className="end-call"
                />
                
                <CallButton
                    icon={onCall === 'calling' ? PhoneCall : Phone}
                    label={onCall === 'calling' ? 'Llamando...' : 'Llamar'}
                    onClick={onCall === 'disconnect' ? makeCall : undefined}
                    disabled={onCall === 'calling' || onCall === 'connect'}
                    className={onCall === 'connect' ? 'active start-call' : 'start-call'}
                    showPulse={onCall === 'calling'}
                />
            </div>

            {/* Los botones de Guardar y Resolver se manejan desde el componente padre Comments */}
            {onSave && onResolve && (
                <div className="call-footer" style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '1.5rem',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #f0f0f0',
                    width: '100%'
                }}>
                    <button 
                        className="footer-btn save-btn"
                        onClick={() => onSave()}
                        disabled={isEndingFolio || onCall === 'connect'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Save size={18} className="btn-icon" />
                        Guardar
                    </button>
                    <button 
                        className="footer-btn resolve-btn"
                        onClick={() => onResolve()}
                        disabled={isEndingFolio}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <CheckCircle size={18} className="btn-icon" />
                        Resolver
                    </button>
                </div>
            )}
        </div>
    );
});

// Asegurarse de que el componente solo se actualice cuando las props cambien
const areEqual = (prevProps, nextProps) => {
    return (
        prevProps.onCall === nextProps.onCall &&
        prevProps.sidCall === nextProps.sidCall &&
        prevProps.currentFolio?._id === nextProps.currentFolio?._id
    );
};

export default React.memo(Call, areEqual);