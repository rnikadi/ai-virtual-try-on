import { useEffect, useRef, useState } from "react";
import { api, type AdminProduct, type Category } from "../api";

interface Props {
  categories: Category[];
  onChanged: () => void;
}

/** Shows each product's image prompt to copy into an image tool, and lets you upload the result. */
export function CatalogAdmin({ categories, onChanged }: Props) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    api
      .adminProducts()
      .then(setProducts)
      .catch((err: Error) => setError(err.message));
  }, []);

  function replace(updated: AdminProduct) {
    setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    onChanged();
  }

  async function copyAll() {
    const text = products.map((p) => `### ${p.sku} - ${p.name}\n${p.imagePrompt}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  const uploaded = products.filter((p) => p.hasUploadedImage).length;

  return (
    <section className="admin">
      <div className="admin-head">
        <div>
          <h1>Product images</h1>
          <p>
            Copy a prompt into your image tool (for example the Gemini app), then upload the image here. Square
            images on a plain background work best for try-on. {uploaded} of {products.length} uploaded.
          </p>
        </div>
        <button className="button secondary" onClick={copyAll} disabled={products.length === 0}>
          {copiedAll ? "Copied" : "Copy all prompts"}
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {categories.map((c) => {
        const items = products.filter((p) => p.categoryId === c.id);
        if (items.length === 0) return null;
        return (
          <div key={c.id} className="admin-group">
            <h2>{c.name}</h2>
            {items.map((p) => (
              <ProductImageRow key={p.id} product={p} onUpdated={replace} />
            ))}
          </div>
        );
      })}
    </section>
  );
}

function ProductImageRow({ product, onUpdated }: { product: AdminProduct; onUpdated: (p: AdminProduct) => void }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("That image is over 10 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onUpdated(await api.uploadProductImage(product.id, file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      onUpdated(await api.resetProductImage(product.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(product.imagePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="admin-row">
      <button
        type="button"
        className="admin-image"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files[0]);
        }}
        disabled={busy}
        aria-label={`Upload image for ${product.name}`}
      >
        <img src={product.imageUrl} alt="" />
        <span className={`badge ${product.hasUploadedImage ? "ok" : "todo"}`}>
          {product.hasUploadedImage ? "Uploaded" : "Placeholder"}
        </span>
      </button>

      <div className="admin-body">
        <div className="admin-title">
          <h3>{product.name}</h3>
          <span className="sku">{product.sku}</span>
        </div>
        <pre className="prompt">{product.imagePrompt}</pre>
        <div className="admin-actions">
          <button className="button secondary small" onClick={copy}>
            {copied ? "Copied" : "Copy prompt"}
          </button>
          <button className="button small" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Uploading…" : product.hasUploadedImage ? "Replace image" : "Upload image"}
          </button>
          {product.hasUploadedImage && (
            <button className="link-button" onClick={reset} disabled={busy}>
              Use placeholder
            </button>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </article>
  );
}
