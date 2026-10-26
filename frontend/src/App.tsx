import { useEffect, useMemo, useState } from "react";
import { api, formatPrice, type Category, type Health, type Product, type TryOnSession } from "./api";
import { RecentTryOns } from "./components/RecentTryOns";
import { TryOnPanel } from "./components/TryOnPanel";
import { photoGuides } from "./photoGuides";

export function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [recent, setRecent] = useState<TryOnSession[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.categories(), api.products(), api.health(), api.recentTryOns()])
      .then(([c, p, h, r]) => {
        setCategories(c);
        setProducts(p);
        setHealth(h);
        setRecent(r);
        setActiveCategory(c[0]?.id ?? null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const category = categories.find((c) => c.id === activeCategory);
  const visible = useMemo(() => products.filter((p) => p.categoryId === activeCategory), [products, activeCategory]);

  if (error) {
    return (
      <div className="fatal">
        <h1>Couldn't reach the store</h1>
        <p>{error}. Is the backend running on port 4000?</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            ◐
          </span>
          Try-On Studio
        </div>
        {health && (
          <span className={`mode mode-${health.tryonMode}`} title={health.imageModel}>
            {health.tryonMode === "gemini" ? `Live · ${health.imageModel}` : "Mock mode · no Gemini key"}
          </span>
        )}
      </header>

      <section className="hero">
        <h1>See it on you before you buy</h1>
        <p>Pick a product, add a photo, and get a realistic preview in seconds.</p>
      </section>

      <nav className="tabs" aria-label="Try-on categories">
        {categories.map((c) => (
          <button
            key={c.id}
            className={`tab ${c.id === activeCategory ? "active" : ""}`}
            onClick={() => {
              setActiveCategory(c.id);
              setSelected(null);
            }}
          >
            {c.name}
          </button>
        ))}
      </nav>

      <div className={`layout ${selected ? "with-panel" : ""}`}>
        <main>
          {category && (
            <div className="category-intro">
              <p>{category.description}</p>
              <p className="needs">
                Needs:{" "}
                {[...new Set(visible.map((p) => photoGuides[p.requiredPhoto].label.toLowerCase()))].join(" or ")}
              </p>
            </div>
          )}
          <div className="grid">
            {visible.map((p) => (
              <article key={p.id} className={`card ${selected?.id === p.id ? "selected" : ""}`}>
                <img src={p.imageUrl} alt={p.name} loading="lazy" />
                <div className="card-body">
                  <p className="eyebrow">{p.brand}</p>
                  <h3>{p.name}</h3>
                  <p className="price">{formatPrice(p)}</p>
                  <button className="button small" onClick={() => setSelected(p)}>
                    Try it on
                  </button>
                </div>
              </article>
            ))}
          </div>
          <RecentTryOns sessions={recent} />
        </main>

        {selected && (
          <TryOnPanel
            product={selected}
            onClose={() => setSelected(null)}
            onComplete={(s) => setRecent((r) => [s, ...r].slice(0, 8))}
          />
        )}
      </div>
    </div>
  );
}
