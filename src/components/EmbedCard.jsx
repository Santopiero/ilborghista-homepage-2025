// src/components/EmbedCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/* =======================
   PROVIDERS WHITELIST
======================= */
const PROVIDERS = {
  youtube: {
    match: (url) => /(?:youtu\.be|youtube\.com)/i.test(url),
    toEmbed: (url) => {
      try {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be")) {
          const id = u.pathname.slice(1);
          return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
        }
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
      } catch { return null; }
    },
    needsConsent: false,
  },
  vimeo: {
    match: (url) => /vimeo\.com/i.test(url),
    toEmbed: (url) => {
      try {
        const u = new URL(url);
        const id = u.pathname.split("/").filter(Boolean).pop();
        return id ? `https://player.vimeo.com/video/${id}` : null;
      } catch { return null; }
    },
    needsConsent: false,
  },
  tiktok: {
    match: (url) => /tiktok\.com/i.test(url),
    toEmbed: (url) => url, // usiamo blockquote + script ufficiale
    needsConsent: true,
    script: "https://www.tiktok.com/embed.js",
    scriptSelector: 'script[src="https://www.tiktok.com/embed.js"]',
    blockquoteClass: "tiktok-embed",
  },
  instagram: {
    match: (url) => /instagram\.com/i.test(url),
    toEmbed: (url) => url, // blockquote + script ufficiale
    needsConsent: true,
    script: "https://www.instagram.com/embed.js",
    scriptSelector: 'script[src="https://www.instagram.com/embed.js"]',
    blockquoteClass: "instagram-media",
  },
};

/* =======================
   HOOK: lazy visibility
======================= */
function useIntersection(ref, rootMargin = "200px") {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { rootMargin }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

function ProviderBadge({ name }) {
  return (
    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border">
      Fonte: {name}
    </span>
  );
}

/* =======================
   COMPONENT
======================= */
export default function EmbedCard({
  url = "",
  title,
  caption,
  allowFullScreen = true,
  aspect = "16/9",
}) {
  const containerRef = useRef(null);
  const visible = useIntersection(containerRef);
  const [consent, setConsent] = useState(() => {
    try {
      const j = localStorage.getItem("ib_embed_consent");
      return j ? JSON.parse(j) : { instagram: false, tiktok: false };
    } catch { return { instagram: false, tiktok: false }; }
  });

  const providerKey = useMemo(() => {
    const key = Object.keys(PROVIDERS).find((k) => PROVIDERS[k].match(url));
    return key || null;
  }, [url]);

  const provider = providerKey ? PROVIDERS[providerKey] : null;

  // Carica script provider (IG/TikTok) solo dopo consenso
  useEffect(() => {
    if (!provider || !provider.needsConsent) return;
    const ok = consent[providerKey] === true;
    if (!ok) return;

    const already = document.querySelector(provider.scriptSelector);
    if (already) return;

    const s = document.createElement("script");
    s.src = provider.script;
    s.async = true;
    document.body.appendChild(s);
    // non rimuoviamo per permettere più embed nella pagina
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerKey, consent, provider]);

  // Rileva fallimento dell’embed social e mostra fallback interno
  const [socialFailed, setSocialFailed] = useState(false);
  useEffect(() => {
    if (!provider || !provider.needsConsent) return;
    if (!consent[providerKey]) return;
    setSocialFailed(false);

    const t = setTimeout(() => {
      // euristica: se il blockquote è ancora lì e non è stato “trasformato”,
      // potremmo considerare l’embed fallito (privato / non embeddabile).
      const host = containerRef.current;
      if (!host) return;
      const block = host.querySelector(`.${provider.blockquoteClass}`);
      if (block) {
        // se non troviamo un iframe generato dal provider, fallback
        const hasIframe = host.querySelector("iframe");
        if (!hasIframe) setSocialFailed(true);
      }
    }, 4500);

    return () => clearTimeout(t);
  }, [provider, providerKey, consent]);

  const grantConsent = () => {
    const next = { ...consent, [providerKey]: true };
    setConsent(next);
    try { localStorage.setItem("ib_embed_consent", JSON.stringify(next)); } catch {}
  };

  /* =======================
     RENDER
  ====================== */
  return (
    <figure ref={containerRef} className="w-full max-w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ProviderBadge name={providerKey ?? "link"} />
          {title ? <strong className="text-sm">{title}</strong> : null}
        </div>
        {/* Nessun link esterno: restiamo sempre in piattaforma */}
      </div>

      <div className="relative w-full rounded-xl overflow-hidden border bg-white">
        {/* Provider non riconosciuto → nessun redirect: mostriamo solo info */}
        {!provider && (
          <div className="p-4 text-sm leading-snug">
            Contenuto esterno non supportato per l’incorporamento diretto.
          </div>
        )}

        {/* YouTube / Vimeo → iframe diretto */}
        {provider && !provider.needsConsent && visible && (
          <div className="relative w-full" style={{ aspectRatio: aspect }}>
            <iframe
              src={provider.toEmbed(url) || ""}
              title={title || "Video"}
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={allowFullScreen}
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        )}

        {/* TikTok / Instagram → gate consenso + embed ufficiale (no uscita) */}
        {provider && provider.needsConsent && (
          <div className="p-3">
            {consent[providerKey] ? (
              socialFailed ? (
                <div className="p-4 rounded-lg border bg-neutral-50 text-sm">
                  Il contenuto di <b>{providerKey}</b> non può essere mostrato qui
                  (post privato o embeddabile non disponibile).
                </div>
              ) : (
                <div className="min-h-[360px]">
                  {providerKey === "tiktok" && (
                    <blockquote
                      className="tiktok-embed"
                      cite={url}
                      style={{ maxWidth: "605px", minWidth: "325px", margin: "0 auto" }}
                    >
                      <section />
                    </blockquote>
                  )}
                  {providerKey === "instagram" && (
                    <blockquote
                      className="instagram-media"
                      data-instgrm-permalink={url}
                      data-instgrm-version="14"
                      style={{ background: "#FFF", border: 0, margin: 0, padding: 0 }}
                    >
                      <div />
                    </blockquote>
                  )}
                </div>
              )
            ) : (
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-neutral-50">
                <div className="text-sm leading-snug">
                  Per visualizzare questo contenuto di <b>{providerKey}</b> occorre il tuo
                  consenso a caricare media da terze parti (cookie/trackers).
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={grantConsent}
                    className="text-sm px-3 py-1.5 rounded-lg bg-black text-white"
                  >
                    Consenti e mostra
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {caption ? (
        <figcaption className="mt-2 text-sm text-neutral-700">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
