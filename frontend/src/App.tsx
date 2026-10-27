import { useEffect, useMemo, useState } from "react";
import { api, formatPrice, type Category, type Health, type Product, type SamplePhoto, type TryOnSession } from "./api";
import { CatalogAdmin } from "./components/CatalogAdmin";
import { RecentTryOns } from "./components/RecentTryOns";
import { TryOnPanel } from "./components/TryOnPanel";
import { photoGuides } from "./photoGuides";

const currentPage = () => (window.location.hash === "#/catalog" ? "catalog" : "store");

export function App() {
  const [page, setPage] = useState(currentPage);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [samples, setSamples] = useState<SamplePhoto[]>([]);
  const [recent, setRecent] = useState<TryOnSession[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.categories(), api.products(), api.health(), api.recentTryOns(), api.samples()])
      .then(([c, p, h, r, s]) => {
        setCategories(c);
        setProducts(p);
        setHealth(h);
        setRecent(r);
        setSamples(s);
        setActiveCategory(c[0]?.id ?? null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    const onHashChange = () => setPage(currentPage());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Picks up images changed on the demo images page.
  const reloadImages = () => {
    api
      .products()
      .then(setProducts)
      .catch(() => {});
    api
      .samples()
      .then(setSamples)
      .catch(() => {});
  };

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
        <div className="topbar-right">
          <a className="nav-link" href={page === "catalog" ? "#/" : "#/catalog"}>
            {page === "catalog" ? "Back to store" : "Demo images"}
          </a>
          {health && (
            <span className={`mode mode-${health.tryonMode}`} title={health.imageModel}>
              {health.tryonMode === "gemini"
                ? `Live · ${health.provider === "vertex" ? "Vertex AI · " : ""}${health.imageModel}`
                : "Mock mode · no Gemini key"}
            </span>
          )}
        </div>
      </header>

      {page === "catalog" ? (
        <CatalogAdmin categories={categories} onChanged={reloadImages} />
      ) : (
        <>
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
                sample={samples.find((s) => s.subject === selected.requiredPhoto)}
                onClose={() => setSelected(null)}
                onComplete={(s) => setRecent((r) => [s, ...r].slice(0, 8))}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
