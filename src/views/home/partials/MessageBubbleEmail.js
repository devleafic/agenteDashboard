import React from 'react';
import moment from 'moment';
import { Avatar, Card, Tooltip } from '@heroui/react';

const MessageBubbleEmail = ({ message }) => {
  const { email, createdAt, direction } = message;
  const isOutgoing = direction === 'out';

  if (!email) {
    return null;
  }

  const { from, to, cc, subject, text, html } = email;

  const renderRecipients = (recipients) => {
    if (!recipients || recipients.length === 0) return null;
    return recipients.map(r => r.name || r.address).join(',');
  };

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`w-full md:w-3/4 lg:w-2/3 ${isOutgoing ? 'ml-auto' : 'mr-auto'}`}>
        <Card className="p-4 bg-cream-50 rounded-lg shadow-md">
          <div className="flex items-start space-x-4">
            <Avatar src={from?.avatar} alt={from?.name} className="h-10 w-10" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-ink">{from?.name}</p>
                  <p className="text-sm text-ink-500">{from?.address}</p>
                </div>
                <Tooltip content={moment(createdAt).format('llll')} className="text-xs text-ink-400">
                  <span>{moment(createdAt).fromNow()}</span>
                </Tooltip>
              </div>

              <div className="mt-2 text-sm text-ink-600">
                <p><span className="font-semibold">To:</span> {renderRecipients(to)}</p>
                {cc && cc.length > 0 && <p><span className="font-semibold">CC:</span> {renderRecipients(cc)}</p>}
              </div>

              <h2 className="mt-4 text-lg font-bold text-ink">{subject}</h2>

              <div
                className="prose prose-sm max-w-none mt-2 text-ink"
                dangerouslySetInnerHTML={{ __html: html || text.replace(/\n/g, '<br />') }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MessageBubbleEmail;