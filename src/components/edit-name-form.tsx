'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

type EditNameFormProps = {
  currentName: string | null;
  locale: string;
};

export function EditNameForm({ currentName, locale }: EditNameFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    fi: {
      edit: 'Muokkaa',
      save: 'Tallenna',
      cancel: 'Peruuta',
      placeholder: 'Kirjoita nimesi',
      error: 'Nimen tallentaminen epäonnistui',
    },
    en: {
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      placeholder: 'Enter your name',
      error: 'Failed to save name',
    },
  };

  const text = t[locale as 'fi' | 'en'] || t.en;

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      setIsEditing(false);
      // Refresh the page to show updated name in header
      window.location.reload();
    } catch {
      setError(text.error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(currentName || '');
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{currentName || '-'}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{text.edit}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={text.placeholder}
          className="h-9 max-w-[200px]"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={loading || !name.trim()}
          className="h-8 w-8 p-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span className="sr-only">{text.save}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{text.cancel}</span>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
