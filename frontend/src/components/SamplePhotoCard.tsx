import { useRef, useState } from "react";
import { api, type SamplePhoto } from "../api";

interface Props {
  sample: SamplePhoto;
  onUpdated: (s: SamplePhoto) => void;
}

export function SamplePhotoCard({ sample, onUpdated }: Props) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setWorking(true);
    setError(null);
    try {
      onUpdated(await api.uploadSample(sample.subject, file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <article className="sample-card">
      <div className="sample-image" title={sample.prompt}>
        {sample.imageUrl ? <img src={sample.imageUrl} alt={`${sample.label} sample`} /> : <span>No photo yet</span>}
      </div>
      <h3>{sample.label}</h3>
      <div className="admin-actions">
        <button className="button secondary small" onClick={() => inputRef.current?.click()} disabled={working}>
          {working ? "Uploading…" : "Upload replacement"}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </article>
  );
}
