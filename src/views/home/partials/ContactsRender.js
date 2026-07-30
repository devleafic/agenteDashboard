import React, { useCallback } from 'react';
import { Avatar, Button, Card, CardBody, CardFooter, Link, addToast } from '@heroui/react';
import { Copy, Check } from 'lucide-react';

/**
 * Renders a list of contact cards
 * @param {Array} contacts - Array of contact objects
 * @returns {JSX.Element}
 */
const Contacts = ({ contacts = [] }) => {
  const [copiedContactId, setCopiedContactId] = React.useState(null);

  const copyToClipboard = useCallback((contact, index) => {
    const contactId = contact.id || `contact-${index}`;
    // Format contact details as text
    let contactText = `${contact.name || 'Contacto'}\n`;
    
    if (contact.org) contactText += `Organización: ${contact.org}\n\n`;
    
    if (contact.tel?.length > 0) {
      contactText += 'Teléfonos:\n';
      contact.tel.forEach(phone => {
        contactText += `- ${phone.type || 'Tel'}: ${phone.number}\n`;
      });
      contactText += '\n';
    }
    
    if (contact.email?.length > 0) {
      contactText += 'Correos electrónicos:\n';
      contact.email.forEach(email => {
        contactText += `- ${email.type || 'Email'}: ${email.address}\n`;
      });
      contactText += '\n';
    }
    
    if (contact.url?.length > 0) {
      contactText += 'Enlaces:\n';
      contact.url.forEach(url => {
        contactText += `- ${url.type || 'Web'}: ${url.url}\n`;
      });
      contactText += '\n';
    }
    
    if (contact.address?.length > 0) {
      contactText += 'Dirección:\n';
      contact.address.forEach(addr => {
        if (addr.street) contactText += `${addr.street}\n`;
        if (addr.city && addr.region) {
          contactText += `${addr.city}, ${addr.region}`;
          if (addr.postalCode) contactText += ` ${addr.postalCode}`;
          contactText += '\n';
        }
        if (addr.country) contactText += `${addr.country}\n`;
      });
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(contactText.trim())
      .then(() => {
        setCopiedContactId(contactId);
        addToast({
          title: 'Contacto copiado',
          message: 'La información del contacto ha sido copiada al portapapeles',
          type: 'success',
          duration: 2000,
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopiedContactId(null), 2000);
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
        addToast({
          title: 'Error',
          message: 'No se pudo copiar la información del contacto',
          type: 'error',
          duration: 2000,
        });
      });
  }, [addToast]);
  return (
    <div className="space-y-2 w-full max-w-md">
      {contacts.map((contact, index) => (
        <Card key={index} className="w-full border border-hair dark:border-gray-700">
          <CardBody className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Avatar
                  src={contact.photo || ''}
                  name={contact.name || ''}
                  className="w-12 h-12 text-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ink dark:text-white truncate">
                  {contact.name || 'Contacto sin nombre'}
                </h4>
                
                {contact.org && (
                  <p className="text-sm text-ink-500 dark:text-gray-300 truncate">
                    {contact.org}
                  </p>
                )}
                
                {contact.tel && contact.tel.length > 0 && (
                  <div className="mt-2">
                    {contact.tel.map((phone, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-ink-500 dark:text-gray-400">
                          {phone.type || 'Tel'}:
                        </span>
                        <Link 
                          href={`tel:${phone.number}`}
                          className="text-ink underline underline-offset-2 hover:decoration-flame-ember"
                        >
                          {phone.number}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                
                {contact.email && contact.email.length > 0 && (
                  <div className="mt-1">
                    {contact.email.map((email, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-ink-500 dark:text-gray-400">
                          {email.type || 'Email'}:
                        </span>
                        <Link 
                          href={`mailto:${email.address}`}
                          className="text-ink underline underline-offset-2 hover:decoration-flame-ember"
                        >
                          {email.address}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                
                {contact.url && contact.url.length > 0 && (
                  <div className="mt-1">
                    {contact.url.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-ink-500 dark:text-gray-400">
                          {url.type || 'Web'}:
                        </span>
                        <Link 
                          href={url.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-ink underline underline-offset-2 hover:decoration-flame-ember"
                        >
                          {url.url}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                
                {contact.address && contact.address.length > 0 && (
                  <div className="mt-1">
                    {contact.address.map((addr, i) => (
                      <div key={i} className="text-sm text-ink-500 dark:text-gray-300">
                        {addr.street && <div>{addr.street}</div>}
                        {addr.city && addr.region && (
                          <div>{`${addr.city}, ${addr.region} ${addr.postalCode || ''}`}</div>
                        )}
                        {addr.country && <div>{addr.country}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
          <CardFooter className="bg-cream-100 dark:bg-gray-800 p-3 flex justify-between items-center">
            <Button
              key={`copy-btn-${contact.id || 'contact'}-${index}`}
              size="sm"
              variant="flat"
              color="secondary"
              className="text-xs"
              startContent={copiedContactId === (contact.id || `contact-${index}`) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              onPress={() => copyToClipboard(contact, index)}
              isDisabled={copiedContactId === (contact.id || `contact-${index}`)}
            >
              {copiedContactId === (contact.id || `contact-${index}`) ? '¡Copiado!' : 'Copiar'}
            </Button>
            
            <div className="flex gap-2">
              {contact.tel && contact.tel.length > 0 && (
                <Button 
                  size="sm" 
                  color="primary" 
                  variant="flat"
                  as="a"
                  href={`tel:${contact.tel[0].number}`}
                  className="text-xs"
                >
                  Llamar
                </Button>
              )}
              
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default Contacts;
