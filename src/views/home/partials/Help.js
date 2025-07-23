import React from 'react';
import { Card, CardHeader, CardBody, CardFooter, Divider, Link, Image, Accordion, AccordionItem } from "@heroui/react";

const Help = ({ show, selectedComponent }) => {
  if (!show) return null;

  const features = [
    { title: "Estatus de calidad de conexión",
      icon: "📶",
      description: "Muestra el estado de la conexión de la plataforma a internet. Si la conexión es estable, el indicador será verde. Si la conexión es inestable, el indicador será amarillo.",
      tips: [
        "Si la conexión es estable, el indicador será verde.",
        "Si la conexión es inestable, el indicador será amarillo.",
        "Si la conexión es muy problemática, el indicador será rojo."
      ]
    },
    {
      title: "Conversaciones",
      icon: "💬",
      description: "Gestiona todas tus conversaciones en un solo lugar. Visualiza el historial de mensajes, contactos recientes y el estado de cada conversación.",
      tips: [
        "Usa la barra de búsqueda para encontrar conversaciones específicas y texto dentro de las conversaciones.",
        "Filtra por no leídos para priorizar tus mensajes pendientes.",
        "Haz clic en cualquier conversación para ver el historial completo."
      ]
    },
    {
      title: "Bandeja de Entrada",
      icon: "📥",
      description: "Revisa y gestiona todos los mensajes entrantes de diferentes canales en una vista unificada.",
      tips: [
        "Los mensajes no leídos se marcan con un indicador rojo.",
        "Usa los filtros para organizar los mensajes por canal o estado.",
        "Aprovechala vista previa rápida."
      ]
    },
    {
      title: "Chat Interno",
      icon: "👥",
      description: "Comunícate con otros miembros de tu equipo en tiempo real. Comparte información y colabora de manera eficiente.",
      tips: [
        "Pide a tu supervisor que te agregue a los equipos o proyectos.",
        "Menciona a compañeros con @ para notificaciones directas.",
        "Comparte archivos arrastrándolos al área de chat.",
        "Activa las notificaciones para no perderte ningún mensaje."
      ]
    },
    {
      title: "Contactos",
      icon: "👤",
      description: "Administra tu lista de contactos y accede rápidamente a la información de cada cliente.",
      tips: [
        "Agrega etiquetas para organizar tus contactos.",
        "Guarda notas importantes sobre cada contacto.",
        "Visualiza el historial de interacciones por contacto.",
        "Busca contactos, crea contactos y accede a la información y comienza a hablar con ellos."
      ]
    },
    {
      title: "CRM",
      icon: "📊",
      description: "Gestiona las relaciones con tus clientes y realiza seguimiento de oportunidades de negocio.",
      tips: [
        "Guarda información sobre tus clientes y realiza seguimiento de sus interacciones.",
        "Registra interacciones importantes con cada cliente.",
        "Pide a tu supervisor que te asigne los pipelines disponibles para dar mejor seguimiento a tus clientes."
      ]
    },
    {
      title: "Calendario",
      icon: "📅",
      description: "Organiza tus citas y reuniones. Recibe recordatorios y nunca pierdas una fecha importante.",
      tips: [
        "Establece recordatorios automáticos.",
        "Comparte disponibilidad con clientes y colegas."
      ]
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent mb-2">
          Centro de Ayuda
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Aprende a aprovechar al máximo todas las funcionalidades de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
              <Divider className="my-3" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Consejos útiles:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {feature.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preguntas Frecuentes</h2>
        </CardHeader>
        <CardBody>
          <Accordion variant="splitted">
            <AccordionItem key="1" aria-label="¿Cómo cambio mi contraseña?" title="¿Cómo cambio mi contraseña?" className="py-2">
              <div className="px-4 py-2 text-gray-600 dark:text-gray-300">
                Para cambiar tu contraseña, debes contactar a tu supervisor.
              </div>
            </AccordionItem>
            <AccordionItem key="2" aria-label="¿Cómo comparto archivos?" title="¿Cómo compartir archivos?" className="py-2">
              <div className="px-4 py-2 text-gray-600 dark:text-gray-300">
                Puedes arrastrar y soltar archivos directamente en el área de chat o usar el botón de adjuntar archivo.
                Los formatos soportados incluyen PDF, DOCX, XLSX, JPG, PNG.
              </div>
            </AccordionItem>
            <AccordionItem key="3" aria-label="¿Cómo crear un nuevo canal?" title="¿Cómo contactar a mis colegas dentro de la plataforma?" className="py-2">
              <div className="px-4 py-2 text-gray-600 dark:text-gray-300">
                Para contactar a tus colegas dentro de la plataforma, debes usar el chat interno.
                Puedes buscar en la barra de búsqueda a tus colegas y seleccionarlos para iniciar una conversación.
                Puedes mencionar a tus colegas con @ para notificaciones directas.
              </div>
            </AccordionItem>
          </Accordion>
        </CardBody>
      </Card>

      <div className="bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-indigo-900/20 dark:to-pink-900/20 rounded-xl p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">¿Necesitas más ayuda?</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Nuestro equipo de soporte está disponible para ayudarte con cualquier pregunta o problema que puedas tener.
        </p>
        <a 
          href="mailto:soporte@tuempresa.com" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Contactar a Soporte
        </a>
      </div>
    </div>
  );
};

export default Help;