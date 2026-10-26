import { useEffect, useState } from "react";
import { api, type Category, type Product } from "./api";

// Placeholder catalog view proving the frontend, API and database are wired up.
// The full stakeholder demo UI replaces this in step 3.
export function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.categories(), api.products()])
      .then(([c, p]) => {
        setCategories(c);
        setProducts(p);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p>Could not load the catalog: {error}</p>;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <h1>Virtual Try-On</h1>
      {categories.map((category) => (
        <section key={category.id}>
          <h2>{category.name}</h2>
          <p>{category.photoGuidance}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {products
              .filter((p) => p.categoryId === category.id)
              .map((p) => (
                <figure key={p.id} style={{ width: 160, margin: 0 }}>
                  <img src={p.imageUrl} alt={p.name} width={160} height={160} />
                  <figcaption>
                    {p.name} · ${(p.priceCents / 100).toFixed(2)}
                  </figcaption>
                </figure>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
