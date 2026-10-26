import { useState } from "react";

interface Props {
  before: string;
  after: string;
}

/** Drag the handle to compare the original photo with the try-on result. */
export function BeforeAfter({ before, after }: Props) {
  const [split, setSplit] = useState(50);
  return (
    <div className="before-after">
      <img src={after} alt="Try-on result" />
      <img src={before} alt="Your photo" className="before" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
      <div className="divider" style={{ left: `${split}%` }} />
      <span className="tag tag-left">Before</span>
      <span className="tag tag-right">After</span>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        aria-label="Compare before and after"
      />
    </div>
  );
}
