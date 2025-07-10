import { useEffect, useState } from 'react';
import { Button, Tooltip, Avatar, Badge, Spacer } from "@heroui/react";
import { useSocket } from '../../../controladores/InternalChatContext';
import avatar from './../../../img/ico.png';

// --- SVG Icon Components ---
const IconWrapper = ({ children }) => (
  <div className="text-gray-400 group-hover:text-white transition-colors">
    {children}
  </div>
);

const ChatIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01" />
  </svg>
);

const InboxIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const FilterIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ContactsIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TeamChatIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const LogoutIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);


const SideBarMenu = ({ page, selectedComponent, isConnected, unReadMessages, userInfo }) => {
    const { unreadMessages: unReadMessagesIC = {} } = useSocket?.() || {};
    const [hasUnread, setHasUnread] = useState(0);
    
    useEffect(() => {
        try {
            if (unReadMessagesIC && typeof unReadMessagesIC === 'object') {
                const count = Object.values(unReadMessagesIC).reduce(
                    (sum, current) => sum + (typeof current === 'number' ? current : 0), 
                    0
                );
                setHasUnread(count);
            }
        } catch (error) {
            console.error('Error calculating unread messages:', error);
            setHasUnread(0);
        }
    }, [unReadMessagesIC]);

    const closeSession = () => {
        try {
            if (typeof window !== 'undefined') {
                // Clear all localStorage
                window.localStorage?.clear();
                
                // Clear all sessionStorage
                window.sessionStorage?.clear();
                
                // Clear any existing cookies
                document.cookie.split(';').forEach(cookie => {
                    const [name] = cookie.trim().split('=');
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                });
                
                // Force reload to ensure all application state is cleared
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error during session close:', error);
            // Still try to redirect even if clearing storage fails
            window.location.href = '/login';
        }
    };

    const navItems = [
        { 
            name: 'home', 
            icon: <ChatIcon />, 
            tooltip: 'Mis Conversaciones',
            badge: false
        },
        { 
            name: 'inbox', 
            icon: <InboxIcon />, 
            tooltip: 'Bandeja de Entrada', 
            badge: Boolean(unReadMessages)
        },
        { 
            name: 'follow', 
            icon: <FilterIcon />, 
            tooltip: 'Seguimientos',
            badge: false
        },
        { 
            name: 'contacts', 
            icon: <ContactsIcon />, 
            tooltip: 'Contactos',
            badge: false
        },
        { 
            name: 'InternalChat', 
            icon: <TeamChatIcon />, 
            tooltip: 'Chat de Equipo', 
            badge: hasUnread > 0 
        },
    ].filter(Boolean); // Remove any null/undefined items

    return (
        <div className="h-full w-16 bg-gray-800 flex flex-col items-center justify-between py-4 shadow-md border-r border-gray-700">
            
            {/* Top section: Logo and main navigation */}
            <div className="flex flex-col items-center gap-4">
                <Tooltip content={`Inbox Central v${process.env.REACT_APP_SYSTEM_VERSION}`} placement="right">
                    <Avatar src={userInfo?.profile?.picture} className="w-10 h-10 text-large" />
                </Tooltip>
                <Spacer y={2}/>
                <div className="flex flex-col gap-3">
                    {navItems.map((item) => {
                        // Deshabilitar el botón si no hay conexión, excepto para el chat interno
                        const isDisabled = isConnected === -1 && item.name !== 'chat';
                        
                        return (
                            <Tooltip 
                                key={item.name}
                                content={item.tooltip} 
                                placement="right" 
                                color="primary"
                                showArrow={true}
                                offset={10}
                                className="z-50"
                            >
                                <Badge content="" color="danger" isInvisible={!item.badge} shape="circle">
                                    <Button
                                        isIconOnly
                                        variant="flat"
                                        color={page === item.name ? "primary" : "default"}
                                        aria-label={item.tooltip}
                                        onPress={() => selectedComponent(item.name)}
                                        isDisabled={isDisabled}
                                        className={`transition-all duration-200 ${page === item.name 
                                            ? 'bg-gradient-to-br from-indigo-500 to-pink-500 text-white scale-110' 
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-105'}`}
                                    >
                                        <IconWrapper className="text-white">{item.icon}</IconWrapper>
                                    </Button>
                                </Badge>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>

            {/* Bottom section: Logout */}
            <div className="flex flex-col items-center">
                <Tooltip content="Cerrar Sesión" placement="right" color="danger">
                    <Button
                        isIconOnly
                        variant="light"
                        aria-label="Cerrar Sesión"
                        onPress={closeSession}
                        className="group"
                    >
                        <IconWrapper><LogoutIcon /></IconWrapper>
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
}

export default SideBarMenu;