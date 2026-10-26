import type { TryOnSession } from "../api";

interface Props {
  sessions: TryOnSession[];
}

export function RecentTryOns({ sessions }: Props) {
  const done = sessions.filter((s) => s.status === "succeeded" && s.resultImageUrl);
  if (done.length === 0) return null;
  return (
    <section className="recent">
      <h2>Recent try-ons</h2>
      <div className="recent-strip">
        {done.map((s) => (
          <a key={s.id} href={s.resultImageUrl!} target="_blank" rel="noreferrer" className="recent-item">
            <img src={s.resultImageUrl!} alt={`Try-on of ${s.productName}`} loading="lazy" />
            <span>{s.productName}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
