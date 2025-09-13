// src/pages/ItineraryWizard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Menu,
  X,
  Calendar,
  MapPin,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  PlusCircle,
} from "lucide-react";
import {
  createDraft,
  getItinerary,
  updateItinerary,
  publish,
} from "../lib/itineraries";
import { getCurrentUser, BORGI_INDEX as STORE_BORGI_INDEX } from "../lib/store";
import { saveImageFromDataURL, getImageBlob, deleteImage } from "../lib/imageStore";

/* ======================= PALETTE ======================= */
const C = {
  primary: "#D54E30",
  primaryDark: "#6B271A",
  cream: "#FAF5E0",
  light: "#F4F4F4",
  gold: "#E1B671",
  danger: "#DC2626",
};

const FALLBACK_BORGI = [
  { slug: "castelmezzano", name: "Castelmezzano" },
  { slug: "pietrapertosa", name: "Pietrapertosa" },
  { slug: "viggiano", name: "Viggiano" },
];

const AUDIENCE_OPTS = [
  { key: "famiglie", label: "Famiglie con bambini" },
  { key: "coppie", label: "Coppie" },
  { key: "gruppo", label: "In gruppo" },
  { key: "solo", label: "Solo" },
];

const CATEGORY_OPTS = [
  "",
  "Cosa vedere",
  "Dove mangiare",
  "Natura",
  "Cultura",
  "Evento",
  "Relax",
  "Sport",
  "Shopping",
  "Pernottare",
];

/* ======================= UTILS ======================= */
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function fileToCompressedDataURL(file, { maxW = 1280, maxH = 1280, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL("image/jpeg", quality)); } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = fr.result;
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
async function filesToCompressedDataURLs(fileList, limit, opts) {
  const files = Array.from(fileList || []).slice(0, limit);
  const out = [];
  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;
    out.push(await fileToCompressedDataURL(f, opts));
  }
  return out;
}

/* ======================= PAGE ======================= */
export default function ItineraryWizard() {
  const user = getCurrentUser();
  const userId = user?.id || "guest";
  const navigate = useNavigate();
  const { id } = useParams();
  const qs = useQuery();
  const shouldPublish = qs.get("publish") === "1" || qs.get("submit") === "1";

  const BORGI_INDEX =
    STORE_BORGI_INDEX && STORE_BORGI_INDEX.length ? STORE_BORGI_INDEX : FALLBACK_BORGI;

  const [it, setIt] = useState(null);
  const [step, setStep] = useState(1);
  const [quotaWarn, setQuotaWarn] = useState(false);

  const [galleryUrls, setGalleryUrls] = useState([]);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // error state
  const [step1Err, setStep1Err] = useState({
    audiences: false, title: false, mainBorgoSlug: false, duration: false, summary: false,
  });
  const [stopErrMap, setStopErrMap] = useState({}); // { [stopId]: { name:bool, description:bool } }

  const didInitRef = useRef(false);

  /* ====== EFFECTS ====== */
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const defaultSuggestedBy = user?.name || "";

    if (id) {
      const exists = getItinerary(id);
      if (exists) {
        setIt({
          suggestedByEnabled: false,
          suggestedBy: defaultSuggestedBy,
          audiences: exists.audiences || [],
          galleryKeys: exists.galleryKeys || [],
          ...exists,
        });
      } else {
        const draft = createDraft(userId);
        setIt({
          ...draft,
          suggestedByEnabled: false,
          suggestedBy: defaultSuggestedBy,
          audiences: [],
          galleryKeys: [],
        });
        navigate(`/itinerari/${draft.id}/edit`, { replace: true });
      }
    } else {
      const draft = createDraft(userId);
      setIt({
        ...draft,
        suggestedByEnabled: false,
        suggestedBy: defaultSuggestedBy,
        audiences: [],
        galleryKeys: [],
      });
      navigate(`/itinerari/${draft.id}/edit`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId]);

  // Migrazione (vecchie dataURL -> IndexedDB)
  useEffect(() => {
    if (!it) return;
    (async () => {
      let changed = false;
      if (it.gallery && Array.isArray(it.gallery) && it.gallery.some((g) => typeof g === "string" && g.startsWith("data:image"))) {
        const keys = [];
        for (const data of it.gallery.slice(0, 3)) keys.push(await saveImageFromDataURL(data));
        it.gallery = undefined;
        it.galleryKeys = keys;
        changed = true;
      }
      if (it.stops && it.stops.length) {
        const next = [];
        for (const s of it.stops) {
          if (s.photo && typeof s.photo === "string" && s.photo.startsWith("data:image")) {
            const key = await saveImageFromDataURL(s.photo);
            next.push({ ...s, photo: undefined, photoKey: key });
            changed = true;
          } else {
            const { time, ...rest } = s; // remove legacy
            next.push(rest);
          }
        }
        it.stops = next;
      }
      if (changed) {
        setIt({ ...it });
        try { updateItinerary(it.id, it); } catch {}
      }
    })();
  }, [it?.id]);

  // Autosave
  useEffect(() => {
    const h = setInterval(() => {
      if (!it?.id) return;
      try { setQuotaWarn(false); updateItinerary(it.id, it); } catch { setQuotaWarn(true); }
    }, 2000);
    return () => clearInterval(h);
  }, [it]);

  // Publish da query
  useEffect(() => {
    if (it && shouldPublish) handlePublish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [it, shouldPublish]);

  // Resolve gallery blobs
  useEffect(() => {
    let disposed = false;
    (async () => {
      const nextUrls = [];
      for (const key of it?.galleryKeys || []) {
        const blob = await getImageBlob(key);
        nextUrls.push(blob ? URL.createObjectURL(blob) : null);
      }
      if (!disposed) {
        setGalleryUrls((prev) => {
          prev.forEach((u) => u && URL.revokeObjectURL(u));
          return nextUrls;
        });
      }
    })();
    return () => {
      disposed = true;
      setGalleryUrls((prev) => {
        prev.forEach((u) => u && URL.revokeObjectURL(u));
        return [];
      });
    };
  }, [JSON.stringify(it?.galleryKeys || [])]);

  /* ====== HANDLERS & VALIDATION ====== */
  function handleChange(field, value) { setIt((prev) => ({ ...prev, [field]: value })); }
  function toggleAudience(key) {
    const set = new Set(it.audiences || []);
    set.has(key) ? set.delete(key) : set.add(key);
    handleChange("audiences", Array.from(set));
  }
  function validateStep1() {
    const e = {
      audiences: !(it.audiences && it.audiences.length),
      title: !it.title?.trim(),
      mainBorgoSlug: !it.mainBorgoSlug?.trim(),
      duration: !it.duration?.trim(),
      summary: !it.summary?.trim(),
    };
    setStep1Err(e);
    return !Object.values(e).some(Boolean);
  }
  function goStep2() {
    if (validateStep1()) setStep(2);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearStopError(stopId, field) {
    setStopErrMap((prev) => {
      if (!prev[stopId]) return prev;
      return { ...prev, [stopId]: { ...prev[stopId], [field]: false } };
    });
  }
  function validateStopsAndNext() {
    const map = {};
    (it.stops || []).forEach((s) => {
      const nameErr = !s.name?.trim();
      const descErr = !s.description?.trim();
      if (nameErr || descErr) map[s.id] = { name: nameErr, description: descErr };
    });
    setStopErrMap(map);
    if (Object.keys(map).length === 0) setStep(3);
    else {
      const first = (it.stops || []).find((s) => map[s.id]);
      if (first) {
        const el = document.getElementById(`stop-${first.id}-name`) || document.getElementById(`stop-${first.id}-desc`);
        el && el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function handlePublish() {
    if (!it.title || !it.mainBorgoSlug || (it.stops || []).length === 0) {
      alert("Titolo, Borgo principale e almeno una tappa sono obbligatori.");
      return;
    }
    const ok = publish(it.id);
    if (!ok) { alert("Errore durante la pubblicazione."); return; }
    alert("Pubblicato! Ora lo trovi nelle esperienze del borgo.");
    navigate(`/borghi/${encodeURIComponent(it.mainBorgoSlug)}/esperienze?tab=itinerari`);
  }

  async function addGalleryFiles(files) {
    const remaining = 3 - (it.galleryKeys?.length || 0);
    if (remaining <= 0) return;
    const dataUrls = await filesToCompressedDataURLs(files, remaining, { maxW: 1280, maxH: 1280, quality: 0.75 });
    const keys = [];
    for (const d of dataUrls) keys.push(await saveImageFromDataURL(d));
    setIt((prev) => ({ ...prev, galleryKeys: (prev.galleryKeys || []).concat(keys).slice(0, 3) }));
    setCarouselIdx(0);
  }
  async function onAddGalleryFiles(e) { try { await addGalleryFiles(e.target.files); } finally { e.target.value = ""; } }
  async function onDropGallery(e) { e.preventDefault(); const files = e.dataTransfer.files; if (!files?.length) return; await addGalleryFiles(files); }
  function onDragOverGallery(e) { e.preventDefault(); }
  async function removeGalleryImage(idx) {
    const key = (it.galleryKeys || [])[idx];
    if (key) await deleteImage(key);
    setIt((prev) => { const arr = [...(prev.galleryKeys || [])]; arr.splice(idx, 1); return { ...prev, galleryKeys: arr }; });
    setCarouselIdx((i) => (i > 0 ? i - 1 : 0));
  }
  function moveGallery(idx, dir) {
    const j = idx + dir;
    setIt((prev) => {
      const arr = [...(prev.galleryKeys || [])];
      if (j < 0 || j >= arr.length) return prev;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...prev, galleryKeys: arr };
    });
    setCarouselIdx((i) => (i === idx ? idx + dir : i === idx + dir ? idx : i));
  }
  function goPrev() { setCarouselIdx((i) => { const n = (it.galleryKeys || []).length; return n ? (i - 1 + n) % n : 0; }); }
  function goNext() { setCarouselIdx((i) => { const n = (it.galleryKeys || []).length; return n ? (i + 1) % n : 0; }); }

  const summaryLen = (it?.summary || "").length;

  /* ====== GUARD ====== */
  if (!it) {
    return (
      <div className="min-h-dvh grid place-items-center text-sm" style={{ color: C.primaryDark }}>
        Creazione bozza in corso…
      </div>
    );
  }

  /* ====== RENDER ====== */
  return (
    <div className="min-h-dvh bg-white">
      {/* Top bar — costante */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/" className="shrink-0 font-extrabold tracking-tight text-[#6B271A]">
            Il Borghista
          </Link>
          <form className="relative mx-2 flex-1">
            <input
              type="search"
              placeholder="Cerca esperienze…"
              className="w-full rounded-full border px-4 py-2 pl-9 text-sm outline-none focus:border-[#6B271A]"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </form>
          <button type="button" aria-label="Menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs scrollabili */}
        <div className="border-t bg-white">
          <div
            className="mx-auto max-w-3xl px-4 py-2 flex items-center gap-2 overflow-x-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStep(n)}
                className="px-3 py-1.5 rounded-xl text-sm border shrink-0"
                style={{
                  borderColor: step === n ? C.primary : C.gold,
                  backgroundColor: step === n ? C.primary : "#FFFFFF",
                  color: step === n ? "#FFFFFF" : C.primaryDark,
                }}
              >
                {["Dettagli", "Tappe", "Consigli", "Anteprima"][n - 1]}
              </button>
            ))}
          </div>

          {/* Stato + Pubblica */}
          <div className="mx-auto max-w-3xl px-4 pb-3 flex items-center justify-between">
            <span className="text-sm" style={{ color: C.primaryDark }}>
              Bozza salvata automaticamente
            </span>
            <button
              type="button"
              onClick={handlePublish}
              className="px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: C.primary, color: "#fff" }}
            >
              Pubblica
            </button>
          </div>

          {quotaWarn && (
            <div className="mx-auto max-w-3xl px-4 pb-3">
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: C.gold, background: "#FFF5F2", color: C.primaryDark }}
              >
                <AlertTriangle className="w-4 h-4" />
                Spazio quasi pieno. Le foto sono su IndexedDB; se persiste, rimuovi qualche immagine.
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* STEP 1 - Dettagli */}
        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: C.primaryDark }}>Dettagli</h2>

            <div className="grid gap-3">
              {/* Consigliato per */}
              <div>
                <div className="mb-1 text-sm" style={{ color: step1Err.audiences ? C.danger : C.primaryDark }}>
                  Consigliato per
                </div>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_OPTS.map((a) => {
                    const active = (it.audiences || []).includes(a.key);
                    return (
                      <label
                        key={a.key}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer"
                        style={{
                          borderColor: step1Err.audiences ? C.danger : C.gold,
                          backgroundColor: active ? C.cream : "#fff",
                          color: C.primaryDark,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleAudience(a.key)}
                          className="accent-[#D54E30]"
                        />
                        <span>{a.label}</span>
                      </label>
                    );
                  })}
                </div>
                {step1Err.audiences && (
                  <p className="text-xs mt-1" style={{ color: C.danger }}>Seleziona almeno una opzione.</p>
                )}
              </div>

              <Field label="Titolo" error={step1Err.title}>
                <input
                  id="title"
                  type="text"
                  value={it.title || ""}
                  onChange={(e) => { handleChange("title", e.target.value); setStep1Err((p)=>({ ...p, title:false })); }}
                  className="border rounded-xl px-3 py-2"
                  style={{ borderColor: step1Err.title ? C.danger : C.gold, color: C.primaryDark }}
                  placeholder="Titolo itinerario"
                />
              </Field>

              <Field label="Borgo principale" error={step1Err.mainBorgoSlug}>
                <input
                  type="text"
                  list="borghi"
                  value={it.mainBorgoSlug || ""}
                  onChange={(e) => { handleChange("mainBorgoSlug", e.target.value); setStep1Err((p)=>({ ...p, mainBorgoSlug:false })); }}
                  className="border rounded-xl px-3 py-2"
                  style={{ borderColor: step1Err.mainBorgoSlug ? C.danger : C.gold, color: C.primaryDark }}
                  placeholder="es. castelmezzano"
                />
                <datalist id="borghi">
                  {(BORGI_INDEX || []).map((b) => (
                    <option key={b.slug} value={b.slug}>{b.name}</option>
                  ))}
                </datalist>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Data del viaggio (opz.)">
                  <input
                    type="date"
                    value={it.dateOfTrip || ""}
                    onChange={(e) => handleChange("dateOfTrip", e.target.value)}
                    className="border rounded-xl px-3 py-2"
                    style={{ borderColor: C.gold, color: C.primaryDark }}
                  />
                </Field>
                <Field label="Durata" error={step1Err.duration}>
                  <input
                    type="text"
                    value={it.duration || ""}
                    onChange={(e) => { handleChange("duration", e.target.value); setStep1Err((p)=>({ ...p, duration:false })); }}
                    className="border rounded-xl px-3 py-2"
                    style={{ borderColor: step1Err.duration ? C.danger : C.gold, color: C.primaryDark }}
                    placeholder="1 giorno, 4 ore, weekend"
                  />
                </Field>
              </div>

              {/* Tag input a chip */}
              <Field label="Tag (opzionali)" hint="Invio o virgola per aggiungere">
                <TagInput
                  value={it.tags || []}
                  onChange={(tags) => handleChange("tags", tags)}
                />
              </Field>

              {/* Summary max 140 */}
              <Field label="Descrizione breve (max 140)" error={step1Err.summary}>
                <textarea
                  value={it.summary || ""}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 140);
                    handleChange("summary", v);
                    setStep1Err((p)=>({ ...p, summary:false }));
                  }}
                  className="border rounded-xl px-3 py-2 min-h-[80px]"
                  style={{ borderColor: step1Err.summary ? C.danger : C.gold, color: C.primaryDark }}
                  placeholder="In poche righe, racconta cosa hai fatto e perché lo consigli."
                />
                <div className="mt-0.5 text-xs text-neutral-500">{summaryLen}/140</div>
              </Field>

              {/* Galleria (max 3) */}
              <div className="grid gap-2">
                <div className="text-sm" style={{ color: C.primaryDark }}>Foto dell'itinerario (max 3)</div>
                <div
                  onDrop={onDropGallery}
                  onDragOver={onDragOverGallery}
                  className="rounded-2xl border-2 p-4 text-center cursor-pointer"
                  style={{ borderColor: C.gold, background: "#FFF8EF" }}
                  onClick={() => document.getElementById("gallery-file-input")?.click()}
                >
                  <div className="text-xs mb-2" style={{ color: C.primaryDark }}>
                    Trascina qui fino a 3 foto oppure <u>clicca per selezionare</u>
                  </div>
                  <input
                    id="gallery-file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onAddGalleryFiles}
                    className="hidden"
                    disabled={(it.galleryKeys || []).length >= 3}
                  />
                  {!!(galleryUrls && galleryUrls.length) && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {galleryUrls.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src || ""} alt={`gallery-${idx}`} className="w-full h-24 object-cover rounded-xl border" style={{ borderColor: C.gold }} />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeGalleryImage(idx); }}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-white border"
                            style={{ borderColor: C.gold }}
                            aria-label="Rimuovi"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-xs" style={{ color: C.primaryDark }}>
                    {(it.galleryKeys?.length || 0)}/3 selezionate
                  </div>
                </div>
              </div>

              {/* 'Suggerito da' opzionale */}
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 items-center">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!it.suggestedByEnabled}
                    onChange={(e) => handleChange("suggestedByEnabled", e.target.checked)}
                  />
                  <span className="text-sm" style={{ color: C.primaryDark }}>Mostra “Suggerito da”</span>
                </label>
                <input
                  type="text"
                  disabled={!it.suggestedByEnabled}
                  value={it.suggestedBy || ""}
                  onChange={(e) => handleChange("suggestedBy", e.target.value)}
                  className="border rounded-xl px-3 py-2 disabled:bg-gray-100"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
                  placeholder={user?.name ? user.name : "es. Maria Rossi"}
                />
              </div>
            </div>

            {/* Solo CONTINUA (niente indietro in Dettagli) */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={goStep2}
                className="px-4 py-2 rounded-xl text-white"
                style={{ backgroundColor: C.primaryDark }}
              >
                Continua
              </button>
            </div>
          </section>
        )}

        {/* STEP 2 - Tappe */}
        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: C.primaryDark }}>Tappe (timeline)</h2>
            <StopsEditor
              stops={it.stops || []}
              onChange={(stops) => handleChange("stops", stops)}
              stopErrMap={stopErrMap}
              onClearErr={clearStopError}
            />

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border"
                style={{ borderColor: C.gold, color: C.primaryDark }}
              >
                Indietro
              </button>
              <button
                type="button"
                onClick={validateStopsAndNext}
                className="px-4 py-2 rounded-xl text-white"
                style={{ backgroundColor: C.primaryDark }}
              >
                Continua
              </button>
            </div>
          </section>
        )}

        {/* STEP 3 - Consigli */}
        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: C.primaryDark }}>Consigli pratici</h2>
            <div className="grid gap-3">
              <TextArea label="Come arrivare" value={it.finalTips?.howToArrive || ""} onChange={(v) => handleChange("finalTips", { ...(it.finalTips || {}), howToArrive: v })} />
              <TextArea label="Parcheggio / come muoversi" value={it.finalTips?.parking || ""} onChange={(v) => handleChange("finalTips", { ...(it.finalTips || {}), parking: v })} />
              <TextArea label="Periodo migliore" value={it.finalTips?.bestPeriod || ""} onChange={(v) => handleChange("finalTips", { ...(it.finalTips || {}), bestPeriod: v })} />
              <TextArea label="Altri consigli" value={it.finalTips?.extraTips || ""} onChange={(v) => handleChange("finalTips", { ...(it.finalTips || {}), extraTips: v })} />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-xl border" style={{ borderColor: C.gold, color: C.primaryDark }}>
                Indietro
              </button>
              <button type="button" onClick={() => setStep(4)} className="px-4 py-2 rounded-xl text-white" style={{ backgroundColor: C.primaryDark }}>
                Continua
              </button>
            </div>
          </section>
        )}

        {/* STEP 4 - Anteprima */}
        {step === 4 && (
          <PreviewSection
            it={it}
            galleryUrls={galleryUrls}
            carouselIdx={carouselIdx}
            setCarouselIdx={setCarouselIdx}
            onPrev={goPrev}
            onNext={goNext}
          />
        )}
      </main>
    </div>
  );
}

/* ======================= SUB-COMPONENTS ======================= */

function Field({ label, children, error, hint }) {
  return (
    <div className="grid gap-1">
      <div className="text-sm" style={{ color: error ? C.danger : C.primaryDark }}>{label}</div>
      {children}
      {hint && <div className="text-xs text-neutral-500">{hint}</div>}
      {error && <div className="text-xs" style={{ color: C.danger }}>Campo obbligatorio.</div>}
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div className="grid gap-1">
      <div className="text-sm" style={{ color: C.primaryDark }}>{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="border rounded-xl px-3 py-2 min-h-[80px]" style={{ borderColor: C.gold, color: C.primaryDark }} />
    </div>
  );
}

/* ---- TagInput a chip ---- */
function TagInput({ value, onChange }) {
  const [input, setInput] = useState("");
  const add = (raw) => {
    const parts = String(raw || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const set = new Set(value || []);
    parts.forEach((p) => set.add(p));
    onChange(Array.from(set));
    setInput("");
  };
  const remove = (tag) => onChange((value || []).filter((t) => t !== tag));
  return (
    <div className="border rounded-xl px-2 py-1.5" style={{ borderColor: C.gold }}>
      <div className="flex flex-wrap gap-1">
        {(value || []).map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: C.gold, color: C.primaryDark }}>
            #{t}
            <button type="button" onClick={() => remove(t)} aria-label={`Rimuovi ${t}`} className="rounded-full -mr-1 p-0.5 hover:bg-neutral-100">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
            else if (e.key === "Backspace" && !input && (value || []).length) remove(value[value.length - 1]);
          }}
          onBlur={() => add(input)}
          className="flex-1 min-w-[120px] px-1 py-0.5 outline-none text-sm"
          placeholder="Aggiungi tag…"
        />
      </div>
    </div>
  );
}

/* -------- StopsEditor -------- */
function StopsEditor({ stops, onChange, stopErrMap, onClearErr }) {
  const [local, setLocal] = useState(stops);
  useEffect(() => setLocal(stops), [stops]);

  // se non c'è nessuna tappa mostra la prima vuota
  useEffect(() => {
    if (!local || !local.length) {
      addStop(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addStop(initial = false) {
    setLocal((prev) => {
      const next = [
        ...prev,
        {
          id: "stop_" + Math.random().toString(36).slice(2, 9),
          name: "",
          category: "",
          description: "",
          cost: "",
          tip: "",
          photoKey: "",
        },
      ];
      onChange(next);
      return next;
    });
    if (!initial) {
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 0);
    }
  }
  function update(idx, patch) {
    const next = [...local];
    next[idx] = { ...next[idx], ...patch };
    setLocal(next);
    onChange(next);
  }
  async function remove(idx) {
    const item = local[idx];
    if (item?.photoKey) await deleteImage(item.photoKey).catch(() => {});
    const next = local.filter((_, i) => i !== idx);
    setLocal(next);
    onChange(next);
  }
  function move(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= local.length) return;
    const next = [...local];
    [next[idx], next[j]] = [next[j], next[idx]];
    setLocal(next);
    onChange(next);
  }
  async function onStopPhotoChange(idx, e) {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const [dataUrl] = await filesToCompressedDataURLs(files, 1, { maxW: 1280, maxH: 1280, quality: 0.75 });
    const key = await saveImageFromDataURL(dataUrl);
    if (local[idx]?.photoKey) await deleteImage(local[idx].photoKey).catch(() => {});
    update(idx, { photoKey: key });
    e.target.value = "";
  }
  async function clearStopPhoto(idx) {
    if (local[idx]?.photoKey) await deleteImage(local[idx].photoKey).catch(() => {});
    update(idx, { photoKey: "" });
  }

  return (
    <ol className="space-y-4">
      {local.map((s, idx) => {
        const err = stopErrMap?.[s.id] || {};
        return (
          <li
            key={s.id || `idx-${idx}`}
            className="relative rounded-2xl border-2 p-3 sm:p-4 shadow-sm"
            style={{ borderColor: C.gold, background: "#FFF8EF", borderLeft: `6px solid ${C.primary}` }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: C.primary, color: "#fff" }}>
                {idx + 1}
              </span>
              <input
                id={`stop-${s.id}-name`}
                type="text"
                value={s.name}
                onChange={(e) => { update(idx, { name: e.target.value }); onClearErr?.(s.id, "name"); }}
                placeholder="Titolo tappa (es. Passeggiata nel centro storico)"
                className="flex-1 border rounded-xl px-3 py-2"
                style={{ borderColor: err.name ? C.danger : C.gold, color: C.primaryDark }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={s.category || ""}
                onChange={(e) => update(idx, { category: e.target.value })}
                className="border rounded-xl px-3 py-2"
                style={{ borderColor: C.gold, color: C.primaryDark }}
              >
                {CATEGORY_OPTS.map((opt, i) => (
                  <option key={i} value={opt}>{opt === "" ? "Categoria (opz.)" : opt}</option>
                ))}
              </select>

              <input
                type="text"
                value={s.cost}
                onChange={(e) => update(idx, { cost: e.target.value })}
                placeholder="Costo (opz.)"
                className="border rounded-xl px-3 py-2 sm:col-span-2 sm:justify-self-start"
                style={{ borderColor: C.gold, color: C.primaryDark }}
              />
            </div>

            <textarea
              id={`stop-${s.id}-desc`}
              value={s.description}
              onChange={(e) => { update(idx, { description: e.target.value }); onClearErr?.(s.id, "description"); }}
              placeholder="Breve descrizione della tappa (obbligatoria)."
              className="mt-2 border rounded-xl px-3 py-2 min-h-[90px] w-full"
              style={{ borderColor: err.description ? C.danger : C.gold, color: C.primaryDark }}
            />
            <input
              type="text"
              value={s.tip || ""}
              onChange={(e) => update(idx, { tip: e.target.value })}
              placeholder="Consiglio personale (opz.)"
              className="mt-2 border rounded-xl px-3 py-2 w-full"
              style={{ borderColor: C.gold, color: C.primaryDark }}
            />

            {/* Foto grande con X in overlay */}
            <div className="mt-3">
              <div className="text-sm mb-1" style={{ color: C.primaryDark }}>Foto della tappa (1 facoltativa)</div>
              <div className="relative rounded-xl border overflow-hidden" style={{ borderColor: C.gold }}>
                {s.photoKey ? (
                  <StopImage photoKey={s.photoKey} />
                ) : (
                  <div className="aspect-video grid place-items-center text-neutral-400 text-sm">Nessuna foto</div>
                )}
                <label className="absolute left-2 bottom-2 inline-block rounded-full border bg-white/90 px-3 py-1 text-xs cursor-pointer" style={{ borderColor: C.gold }}>
                  Carica foto
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onStopPhotoChange(idx, e)} />
                </label>
                {s.photoKey && (
                  <button type="button" onClick={() => clearStopPhoto(idx)} className="absolute right-2 top-2 rounded-full bg-white/90 p-1 border" style={{ borderColor: C.gold }} aria-label="Rimuovi foto">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Barra comandi in basso: frecce a sinistra, CESTINO poi + a destra */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(idx, -1)} className="p-1.5 rounded-lg border bg-white hover:bg-gray-50" style={{ borderColor: C.gold }} aria-label="Su" title="Su">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => move(idx, +1)} className="p-1.5 rounded-lg border bg-white hover:bg-gray-50" style={{ borderColor: C.gold }} aria-label="Giù" title="Giù">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => remove(idx)} className="p-1.5 rounded-lg border bg-white hover:bg-gray-50" style={{ borderColor: C.gold }} aria-label="Rimuovi tappa" title="Rimuovi tappa">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => addStop()} className="p-1.5 rounded-lg border bg-white hover:bg-gray-50" style={{ borderColor: C.gold }} aria-label="Aggiungi tappa" title="Aggiungi tappa">
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* errori specifici */}
            {(err.name || err.description) && (
              <p className="mt-2 text-xs" style={{ color: C.danger }}>
                Compila i campi obbligatori (titolo e breve descrizione).
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StopImage({ photoKey }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let disposed = false;
    (async () => {
      const b = await getImageBlob(photoKey);
      const u = b ? URL.createObjectURL(b) : null;
      if (!disposed) setUrl(u);
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [photoKey]);
  return url ? <img src={url} alt="foto tappa" className="w-full h-full object-cover aspect-video" /> : null;
}

/* -------- Anteprima -------- */
function PreviewSection({ it, galleryUrls, carouselIdx, setCarouselIdx, onPrev, onNext }) {
  const [stopUrls, setStopUrls] = useState([]);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const keys = (it.stops || []).map((s) => s.photoKey || "");
      const urls = [];
      for (const k of keys) {
        if (!k) { urls.push(null); continue; }
        const b = await getImageBlob(k);
        urls.push(b ? URL.createObjectURL(b) : null);
      }
      if (!disposed) {
        setStopUrls((prev) => {
          prev.forEach((u) => u && URL.revokeObjectURL(u));
          return urls;
        });
      }
    })();
    return () => {
      disposed = true;
      setStopUrls((prev) => { prev.forEach((u) => u && URL.revokeObjectURL(u)); return []; });
    };
  }, [JSON.stringify((it.stops || []).map((s) => s.photoKey || ""))]);

  const hasTips =
    it?.finalTips &&
    (it.finalTips.howToArrive || it.finalTips.parking || it.finalTips.bestPeriod || it.finalTips.extraTips);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: C.primaryDark }}>Anteprima</h2>

      <div className="border-2 rounded-2xl overflow-hidden" style={{ borderColor: C.gold }}>
        {/* Carousel */}
        <div className="relative bg-gray-100">
          {galleryUrls && galleryUrls.length > 0 ? (
            <div className="w-full aspect-video relative">
              <img src={galleryUrls[carouselIdx] || ""} alt={`slide-${carouselIdx}`} className="w-full h-full object-cover" />
              {galleryUrls.length > 1 && (
                <>
                  <button type="button" onClick={onPrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 border" style={{ borderColor: C.gold }} aria-label="Prev">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={onNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 border" style={{ borderColor: C.gold }} aria-label="Next">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
                {(galleryUrls || []).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCarouselIdx(i)}
                    className="w-2.5 h-2.5 rounded-full border"
                    style={{ borderColor: C.gold, backgroundColor: i === carouselIdx ? C.primary : "white" }}
                    aria-label={`Vai a slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full h-full grid place-items-center text-gray-400">
              Nessuna foto
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-xl" style={{ color: C.primaryDark }}>{it.title || "Senza titolo"}</h3>

          {it.suggestedByEnabled && it.suggestedBy && (
            <div className="mt-1 text-sm" style={{ color: C.primaryDark }}>
              <em>Suggerito da {it.suggestedBy}</em>
            </div>
          )}

          {!!(it.audiences && it.audiences.length) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {it.audiences.map((k) => {
                const lab =
                  AUDIENCE_OPTS.find((o) => o.key === k)?.label || k;
                return (
                  <span key={k} className="text-xs rounded-full border px-2 py-0.5" style={{ borderColor: C.gold, color: C.primaryDark }}>
                    {lab}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{it.mainBorgoSlug || "—"}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" />{it.duration || "—"}</span>
          </div>

          <p className="mt-2" style={{ color: C.primaryDark }}>{it.summary || "—"}</p>

          {!!(it.tags && it.tags.length) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {it.tags.map((t, i) => (
                <span key={i} className="text-xs rounded-full border px-2 py-0.5" style={{ borderColor: C.gold, color: C.primaryDark }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {hasTips && (
            <div className="mt-4 rounded-xl border p-3" style={{ borderColor: C.gold }}>
              <h4 className="font-semibold mb-2" style={{ color: C.primaryDark }}>Consigli pratici</h4>
              <ul className="space-y-1 text-sm" style={{ color: C.primaryDark }}>
                {it.finalTips?.howToArrive && (<li><span className="font-medium">Come arrivare: </span>{it.finalTips.howToArrive}</li>)}
                {it.finalTips?.parking && (<li><span className="font-medium">Parcheggio / come muoversi: </span>{it.finalTips.parking}</li>)}
                {it.finalTips?.bestPeriod && (<li><span className="font-medium">Periodo migliore: </span>{it.finalTips.bestPeriod}</li>)}
                {it.finalTips?.extraTips && (<li><span className="font-medium">Altri consigli: </span>{it.finalTips.extraTips}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <h4 className="font-semibold mb-2" style={{ color: C.primaryDark }}>Tappe</h4>
            <ol className="space-y-3">
              {(it.stops || []).map((s, idx) => (
                <li key={s.id || `idx-${idx}`} className="border rounded-xl p-3" style={{ borderColor: C.gold }}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs" style={{ backgroundColor: C.primary, color: "#fff" }}>
                      {idx + 1}
                    </span>
                    {stopUrls[idx] && (
                      <img
                        src={stopUrls[idx]}
                        alt={`stop-${idx}`}
                        className="w-12 h-12 object-cover rounded-lg border cursor-zoom-in"
                        style={{ borderColor: C.gold }}
                        onClick={() => setLightboxUrl(stopUrls[idx])}
                      />
                    )}
                    <div className="font-medium" style={{ color: C.primaryDark }}>{s.name || "Tappa"}</div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.category && (<span className="text-xs rounded-full border px-2 py-0.5" style={{ borderColor: C.gold, color: C.primaryDark }}>{s.category}</span>)}
                    {s.cost && (<span className="text-xs rounded-full border px-2 py-0.5" style={{ borderColor: C.gold, color: C.primaryDark }}>Costo: {s.cost}</span>)}
                  </div>

                  <p className="mt-2 text-sm" style={{ color: C.primaryDark }}>{s.description || "—"}</p>
                  {s.tip && (<p className="mt-1 text-sm italic" style={{ color: C.primaryDark }}>Consiglio: {s.tip}</p>)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Lightbox foto tappa */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="foto tappa" className="max-w-[92vw] max-h-[92vh] object-contain rounded-xl" />
        </div>
      )}
    </section>
  );
}
