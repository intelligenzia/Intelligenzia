'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Trash2 } from 'lucide-react';

const SIZE = 320;
const MAX_INPUT_BYTES = 20 * 1024 * 1024;

export function initials(name: string | null | undefined, email: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (words[0]?.[0] ?? email?.[0] ?? '?').toUpperCase();
}

/** Center-crops to a square and shrinks to SIZE px, as a JPEG. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background, not black
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE
  );
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.85)
  );
}

type Props = { locale: string; image: string | null; name: string | null; email: string | null };

/** The member's own profile picture: upload (cropped in the browser) or remove. */
export function ProfileImage({ locale, image, name, email }: Props) {
  const fi = locale === 'fi';
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(image);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/') || file.size > MAX_INPUT_BYTES) {
      setError(fi ? 'Valitse kuvatiedosto (enintään 20 Mt).' : 'Choose an image file (up to 20 MB).');
      return;
    }
    setBusy(true);
    try {
      const blob = await toSquareJpeg(file);
      const res = await fetch('/api/account/image', {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'failed');
      setUrl(data.url);
      router.refresh();
    } catch {
      setError(
        fi
          ? 'Kuvaa ei voitu tallentaa. Kokeile toista kuvaa (JPEG, PNG tai WebP).'
          : "Couldn't save the picture. Try another image (JPEG, PNG or WebP)."
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/image', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUrl(null);
      router.refresh();
    } catch {
      setError(fi ? 'Kuvan poistaminen epäonnistui.' : "Couldn't remove the picture.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16 border">
        {url && <AvatarImage src={url} alt={fi ? 'Profiilikuvasi' : 'Your profile picture'} className="object-cover" />}
        <AvatarFallback className="text-lg">{initials(name, email)}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            id="profile-image-input"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {url ? (fi ? 'Vaihda kuva' : 'Change picture') : fi ? 'Lisää kuva' : 'Add picture'}
          </Button>
          {url && (
            <Button variant="ghost" size="sm" disabled={busy} onClick={remove}>
              <Trash2 className="mr-2 h-4 w-4" />
              {fi ? 'Poista' : 'Remove'}
            </Button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
