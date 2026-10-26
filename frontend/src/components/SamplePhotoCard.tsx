import { useRef, useState } from "react";
import { api, type SamplePhoto } from "../api";

interface Props {
  sample: SamplePhoto;
  canGenerate: boolean;
  /** True while "Generate missing" is working on this sample. */
  generating: boolean;
  onUpdated: (s: SamplePhoto) => void;
}

export function SamplePhotoCard({ sample, canGenerate, generating, onUpdated }: Props) {
  const [working, setWorking] = useState<"upload" | "generate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function run(kind: "upload" | "generate", action: () => Promise<SamplePhoto>) {
    setWorking(kind);
    setError(null);
    try {
      onUpdated(await action());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(null);
    }
  }

  const busy = working !== null || generating;
  const isGenerating = working === "generate" || generating;

  return (
    <article className="sample-card">
      <div className="sample-image" title={sample.prompt}>
        {sample.imageUrl ? <img src={sample.imageUrl} alt={`${sample.label} sample`} /> : <span>No photo yet</span>}
        {isGenerating && (
          <span className="scan">
            <span className="spinner" />
            Generating…
          </span>
        )}
      </div>
      <h3>{sample.label}</h3>
      <div className="admin-actions">
        <button
          className="button small"
          onClick={() => run("generate", () => api.generateSample(sample.subject))}
          disabled={!canGenerate || busy}
        >
          {isGenerating ? "Generating…" : sample.imageUrl ? "Regenerate" : "Generate"}
        </button>
        <button className="button secondary small" onClick={() => inputRef.current?.click()} disabled={busy}>
          {working === "upload" ? "Uploading…" : "Upload"}
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
          if (file) run("upload", () => api.uploadSample(sample.subject, file));
          e.target.value = "";
        }}
      />
    </article>
  );
}
