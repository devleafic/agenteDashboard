import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip, Divider } from '@heroui/react';
import { Sparkles } from 'lucide-react';
import changelogs from '../../../data/changelogs.json';

const typeColor = {
  added: 'success',
  improved: 'primary',
  fixed: 'warning',
  removed: 'danger'
};

export default function ChangelogModal({ open, onClose }) {
  const { currentVersion, releases } = changelogs || { currentVersion: '', releases: [] };
  const current = releases?.find(r => r.version === currentVersion) || releases?.[0];

  return (
    <Modal isOpen={open} onOpenChange={(isOpen) => { if (!isOpen) onClose?.(); }} size="xl" backdrop="blur" placement="center">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-flame-ember" />
          <div className="flex items-center gap-2">
            <span>Changelog</span>
            {currentVersion ? (
              <Chip color="primary" variant="flat">v{currentVersion}</Chip>
            ) : null}
          </div>
        </ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
          {releases?.map((rel) => (
            <div key={rel.version} className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Chip color={rel.version === currentVersion ? 'primary' : 'default'} variant="flat">v{rel.version}</Chip>
                  <span className="text-sm text-ink-500">{rel.date}</span>
                </div>
              </div>
              {Array.isArray(rel.highlights) && rel.highlights.length > 0 && (
                <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-ink-600">
                  {rel.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
              {Array.isArray(rel.changes) && rel.changes.length > 0 && (
                <div className="mt-3 space-y-2">
                  {rel.changes.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg border border-hair bg-cream-50 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color={typeColor[c.type] || 'default'} variant="flat" className="capitalize">
                          {c.type}
                        </Chip>
                        <span className="font-medium text-sm">{c.title}</span>
                      </div>
                      {c.details && (
                        <p className="text-xs text-ink-600 mt-1">{c.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Divider className="mt-4" />
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>Cerrar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
