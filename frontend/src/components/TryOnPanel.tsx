import { useEffect, useRef, useState } from "react";
import { api, formatPrice, type Product, type SamplePhoto, type TryOnSession } from "../api";
import { photoGuides } from "../photoGuides";
import { BeforeAfter } from "./BeforeAfter";

interface Props {
  product: Product;
  /** A ready-made photo of the kind this product needs, for shoppers who don't want to upload one. */
  sample?: SamplePhoto;
  onClose: () => void;
  onComplete: (session: TryOnSession) => void;
}

const PROGRESS_STEPS = [
  "Checking your photo",
  "Fitting the product",
  "Matching light and shadows",
  "Finishing touches",
];

export function TryOnPanel({ product, sample, onClose, onComplete }: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<TryOnSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const guide = photoGuides[product.requiredPhoto];

  // Start fresh when the shopper picks another product, and bring the panel into view on phones.
  useEffect(() => {
    setSession(null);
    setError(null);
    if (window.matchMedia("(max-width: 860px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [product.id]);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!running) return;
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1)), 2500);
    return () => clearInterval(timer);
  }, [running]);

  function choose(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("That photo is over 10 MB. Please choose a smaller one.");
      return;
    }
    setPhoto(file);
    setSession(null);
    setError(null);
  }

  async function useSample() {
    if (!sample?.imageUrl) return;
    try {
      choose(await api.fetchAsFile(sample.imageUrl, `${sample.subject}-sample.jpg`));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function run() {
    if (!photo) return;
    setRunning(true);
    setError(null);
    setSession(null);
    try {
      const result = await api.tryOn(product.id, photo);
      setSession(result);
      if (result.status === "failed") setError(result.errorMessage ?? "The try-on failed. Please try again.");
      onComplete(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const succeeded = session?.status === "succeeded" && session.resultImageUrl;

  return (
    <aside ref={panelRef} className="panel" aria-label={`Try on ${product.name}`}>
      <header className="panel-header">
        <img src={product.imageUrl} alt="" className="panel-thumb" />
        <div>
          <p className="eyebrow">{product.brand}</p>
          <h2>{product.name}</h2>
          <p className="price">{formatPrice(product)}</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      {succeeded ? (
        <section className="result">
          <BeforeAfter before={session.userImageUrl} after={session.resultImageUrl!} />
          <p className="meta">
            Generated in {((session.latencyMs ?? 0) / 1000).toFixed(1)}s with {session.model}
          </p>
          <div className="actions">
            <a className="button secondary" href={session.resultImageUrl!} download>
              Download
            </a>
            <button className="button secondary" onClick={() => setSession(null)}>
              Try another photo
            </button>
            <button className="button">Add to cart</button>
          </div>
        </section>
      ) : (
        <section>
          <div className="guide">
            <h3>You'll need a {guide.label.toLowerCase()}</h3>
            <ul>
              {guide.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className={`dropzone ${preview ? "has-photo" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              choose(e.dataTransfer.files[0]);
            }}
            disabled={running}
          >
            {preview ? (
              <img src={preview} alt="Your photo" />
            ) : (
              <span>
                <strong>Upload a photo</strong>
                <br />
                Drag it here, or tap to choose or take one
              </span>
            )}
            {running && (
              <span className="scan" aria-live="polite">
                <span className="spinner" />
                {PROGRESS_STEPS[step]}…
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture={product.requiredPhoto === "room" ? "environment" : "user"}
            hidden
            onChange={(e) => {
              choose(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {sample?.imageUrl && (
            <div className="sample-offer">
              <img src={sample.imageUrl} alt="" />
              <p>No photo handy? Try it on our sample model.</p>
              <button className="button secondary small" onClick={useSample} disabled={running}>
                Use sample
              </button>
            </div>
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button className="button wide" onClick={run} disabled={!photo || running}>
            {running ? "Working on it…" : "Try it on"}
          </button>
          <p className="privacy">Your photo is used only to create this preview.</p>
        </section>
      )}
    </aside>
  );
}
