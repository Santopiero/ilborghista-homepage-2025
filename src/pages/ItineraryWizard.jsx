// src/pages/ItineraryWizard.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Calendar } from "lucide-react";
import { createDraft, getItinerary, updateItinerary, submitForReview } from "../lib/itineraries";
import { getCurrentUser, BORGI_INDEX as STORE_BORGI_INDEX } from "../lib/store";

/* ======================= PALETTE ======================= */
const C = {
  primary: "#D54E30",
  primaryDark: "#6B271A",
  cream: "#FAF5E0",
  light: "#F4F4F4",
  gold: "#E1B671",
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

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ItineraryWizard() {
  const user = getCurrentUser();
  const userId = user?.id || "guest";

  const navigate = useNavigate();
  const { id } = useParams();
  const qs = useQuery();
  const shouldSubmit = qs.get("submit") === "1";

  const BORGI_INDEX =
    STORE_BORGI_INDEX && STORE_BORGI_INDEX.length ? STORE_BORGI_INDEX : FALLBACK_BORGI;

  const [it, setIt] = useState(null);
  const [step, setStep] = useState(1);

  // Carica o crea bozza
  useEffect(() => {
    if (id) {
      const exists = getItinerary(id);
      if (exists) {
        setIt({
          suggestedByEnabled: false,
          suggestedBy: user?.name || "",
          audiences: exists.audiences || [],
          ...exists,
        });
      } else {
        const draft = createDraft(userId);
        setIt({ ...draft, suggestedByEnabled: false, suggestedBy: user?.name || "", audiences: [] });
        navigate(`/itinerari/${draft.id}/edit`, { replace: true });
      }
    } else {
      const draft = createDraft(userId);
      setIt({ ...draft, suggestedByEnabled: false, suggestedBy: user?.name || "", audiences: [] });
      navigate(`/itinerari/${draft.id}/edit`, { replace: true });
    }
  }, [id, userId, user, navigate]);

  // Autosave
  useEffect(() => {
    const h = setInterval(() => {
      if (it?.id) updateItinerary(it.id, it);
    }, 2000);
    return () => clearInterval(h);
  }, [it]);

  // Submit da query
  useEffect(() => {
    if (it && shouldSubmit) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [it, shouldSubmit]);

  if (!it) return null;

  function handleChange(field, value) {
    setIt((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAudience(key) {
    const set = new Set(it.audiences || []);
    set.has(key) ? set.delete(key) : set.add(key);
    handleChange("audiences", Array.from(set));
  }

  function handleSubmit() {
    if (!it.title || !it.mainBorgoSlug || (it.stops || []).length === 0) {
      alert("Titolo, Borgo principale e almeno una tappa sono obbligatori.");
      return;
    }
    submitForReview(it.id);
    alert("Inviato in revisione. Grazie per il tuo contributo!");
    navigate("/itinerari");
  }

  return (
    <div className="min-h-dvh bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border hover:bg-gray-50"
            aria-label="Indietro"
            style={{ borderColor: C.gold }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: C.primaryDark }} />
          </button>
          <Link to="/" className="font-bold" style={{ color: C.primaryDark }}>Il Borghista</Link>
          <span className="ml-auto text-sm" style={{ color: C.primaryDark }}>Bozza salvata automaticamente</span>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-3 flex items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setStep(n)}
              className="px-3 py-1.5 rounded-xl text-sm border"
              style={{
                borderColor: step === n ? C.primary : C.gold,
                backgroundColor: step === n ? C.primary : "#FFFFFF",
                color: step === n ? "#FFFFFF" : C.primaryDark,
              }}
            >
              {["Base", "Tappe", "Consigli", "Anteprima"][n - 1]}
            </button>
          ))}
          <button
            type="button"
            onClick={handleSubmit}
            className="ml-auto px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: C.primary, color: "#fff" }}
          >
            Invia per revisione
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* STEP 1 */}
        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: C.primaryDark }}>Info di base</h2>

            <div className="grid gap-3">
              <Field label="Titolo">
                <input
                  value={it.title || ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="border rounded-xl px-3 py-2"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
                  placeholder="Weekend tra gusto e natura…"
                />
              </Field>

              <Field label="Borgo principale">
                <input
                  list="borghi"
                  value={it.mainBorgoSlug || ""}
                  onChange={(e) => handleChange("mainBorgoSlug", e.target.value)}
                  className="border rounded-xl px-3 py-2"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
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
                <Field label="Durata">
                  <input
                    value={it.duration || ""}
                    onChange={(e) => handleChange("duration", e.target.value)}
                    className="border rounded-xl px-3 py-2"
                    style={{ borderColor: C.gold, color: C.primaryDark }}
                    placeholder="1 giorno, 2 giorni, weekend…"
                  />
                </Field>
              </div>

              <Field label="Tag (opzionali, separa con virgola)">
                <input
                  value={(it.tags || []).join(", ")}
                  onChange={(e) =>
                    handleChange(
                      "tags",
                      e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  className="border rounded-xl px-3 py-2"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
                  placeholder="famiglia, natura, gusto"
                />
              </Field>

              <Field label="Descrizione breve">
                <textarea
                  value={it.summary || ""}
                  onChange={(e) => handleChange("summary", e.target.value)}
                  className="border rounded-xl px-3 py-2 min-h-[80px]"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
                  placeholder="In poche righe, racconta cosa hai fatto e perché lo consigli."
                />
              </Field>

              <Field label="Cover (URL immagine)">
                <input
                  value={it.coverUrl || ""}
                  onChange={(e) => handleChange("coverUrl", e.target.value)}
                  className="border rounded-xl px-3 py-2"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
                  placeholder="https://…"
                />
              </Field>

              {/* Consigliato per */}
              <div>
                <div className="mb-1 text-sm" style={{ color: C.primaryDark }}>Consigliato per</div>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_OPTS.map((a) => {
                    const active = (it.audiences || []).includes(a.key);
                    return (
                      <button
                        type="button"
                        key={a.key}
                        onClick={() => toggleAudience(a.key)}
                        className="px-3 py-1.5 rounded-2xl text-sm border"
                        style={{
                          borderColor: active ? C.primary : C.gold,
                          backgroundColor: active ? C.primary : "#fff",
                          color: active ? "#fff" : C.primaryDark,
                        }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
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
                  <span className="text-sm" style={{ color: C.primaryDark }}>
                    Mostra “Suggerito da”
                  </span>
                </label>
                <input
                  disabled={!it.suggestedByEnabled}
                  value={it.suggestedBy || ""}
                  onChange={(e) => handleChange("suggestedBy", e.target.value)}
                  className="border rounded-xl px-3 py-2 disabled:bg-gray-100"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
                  placeholder={user?.name ? user.name : "es. Maria Rossi"}
                />
              </div>
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: C.primaryDark }}>Tappe (timeline)</h2>
            <StopsEditor
              stops={it.stops || []}
              onChange={(stops) => handleChange("stops", stops)}
            />
          </section>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: C.primaryDark }}>Consigli pratici</h2>
            <div className="grid gap-3">
              <TextArea
                label="Come arrivare"
                value={it.finalTips?.howToArrive || ""}
                onChange={(v) => handleChange("finalTips", { ...(it.finalTips || {}), howToArrive: v })}
              />
              <TextArea
                label="Parcheggio / come muoversi"
                value={it.finalTips?.parking || ""}
                onChange={(v) => handleChange("finalTips", { ...(it.finalTips || {}), parking: v })}
              />
              <TextArea
                label="Periodo migliore"
                value={it.finalTips?.bestPeriod || ""}
                onChange={(v) => handleChange("finalTips", { ...(it.finalTips || {}), bestPeriod: v })}
              />
              <TextArea
                label="Altri consigli"
                value={it.finalTips?.extraTips || ""}
                onChange={(v) => handleChange("finalTips", { ...(it.finalTips || {}), extraTips: v })}
              />
            </div>
          </section>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: C.primaryDark }}>Anteprima</h2>
            <div className="border-2 rounded-2xl overflow-hidden" style={{ borderColor: C.gold }}>
              <div className="aspect-video bg-gray-100">
                {it.coverUrl ? (
                  <img src={it.coverUrl} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Nessuna cover</div>
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
                      const lab = AUDIENCE_OPTS.find((o) => o.key === k)?.label || k;
                      return (
                        <span key={k} className="text-xs rounded-full border px-2 py-0.5"
                              style={{ borderColor: C.gold, color: C.primaryDark }}>
                          {lab}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4"/>{it.mainBorgoSlug || "—"}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4"/>{it.duration || "—"}</span>
                </div>

                <p className="mt-2" style={{ color: C.primaryDark }}>{it.summary || "—"}</p>

                {!!(it.tags && it.tags.length) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {it.tags.map((t, i) => (
                      <span key={i} className="text-xs rounded-full border px-2 py-0.5"
                            style={{ borderColor: C.gold, color: C.primaryDark }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <h4 className="font-semibold mb-2" style={{ color: C.primaryDark }}>Tappe</h4>
                  <ol className="space-y-3">
                    {(it.stops || []).map((s, idx) => (
                      <li key={s.id || `idx-${idx}`} className="border rounded-xl p-3" style={{ borderColor: C.gold }}>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
                                style={{ backgroundColor: C.primary, color: "#fff" }}>{idx + 1}</span>
                          <div className="font-medium" style={{ color: C.primaryDark }}>{s.name || "Tappa"}</div>
                        </div>
                        <p className="mt-2 text-sm" style={{ color: C.primaryDark }}>{s.description || "—"}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ======================= Sub-components ======================= */

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm" style={{ color: C.primaryDark }}>{label}</span>
      {children}
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm" style={{ color: C.primaryDark }}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-xl px-3 py-2 min-h-[80px]"
        style={{ borderColor: C.gold, color: C.primaryDark }}
      />
    </label>
  );
}

function StopsEditor({ stops, onChange }) {
  const [local, setLocal] = useState(stops);

  useEffect(() => setLocal(stops), [stops]);

  function addStop() {
    setLocal((prev) => [
      ...prev,
      { id: "stop_" + Math.random().toString(36).slice(2, 9), name: "", category: "", description: "", time: "", cost: "", tip: "" },
    ]);
  }
  function update(idx, patch) {
    const next = [...local];
    next[idx] = { ...next[idx], ...patch };
    setLocal(next);
    onChange(next);
  }
  function remove(idx) {
    const next = local.filter((_, i) => i !== idx);
    setLocal(next);
    onChange(next);
  }
  function move(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= local.length) return;
    const next = [...local];
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: C.primaryDark }}>Aggiungi le tappe del tuo racconto.</p>
        <button
          type="button"
          onClick={addStop}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-white shadow-sm"
          style={{ backgroundColor: C.primaryDark }}
        >
          <Plus className="w-4 h-4" /> Aggiungi tappa
        </button>
      </div>

      <ol className="space-y-4">
        {local.map((s, idx) => (
          <li
            key={s.id || `idx-${idx}`}
            className="rounded-2xl border-2 p-3 sm:p-4 shadow-sm"
            style={{
              borderColor: C.gold,
              background: "#FFF8EF",
              borderLeft: `6px solid ${C.primary}`,
            }}
          >
            {/* Header compatto della tappa */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                style={{ backgroundColor: C.primary, color: "#fff" }}
              >
                {idx + 1}
              </span>
              <input
                value={s.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Titolo tappa (es. Passeggiata nel centro storico)"
                className="flex-1 border rounded-xl px-3 py-2"
                style={{ borderColor: C.gold, color: C.primaryDark }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={s.category}
                onChange={(e) => update(idx, { category: e.target.value })}
                placeholder="Categoria (cosa_vedere, mangiare, evento…)"
                className="border rounded-xl px-3 py-2"
                style={{ borderColor: C.gold, color: C.primaryDark }}
              />
              <input
                value={s.time}
                onChange={(e) => update(idx, { time: e.target.value })}
                placeholder="Orario (opz.)"
                className="border rounded-xl px-3 py-2"
                style={{ borderColor: C.gold, color: C.primaryDark }}
              />
              <input
                value={s.cost}
                onChange={(e) => update(idx, { cost: e.target.value })}
                placeholder="Costo (opz.)"
                className="border rounded-xl px-3 py-2"
                style={{ borderColor: C.gold, color: C.primaryDark }}
              />
            </div>

            <textarea
              value={s.description}
              onChange={(e) => update(idx, { description: e.target.value })}
              placeholder="Racconta cosa hai fatto, perché ti è piaciuto e a chi lo consigli."
              className="mt-2 border rounded-xl px-3 py-2 min-h-[90px] w-full"
              style={{ borderColor: C.gold, color: C.primaryDark }}
            />
            <input
              value={s.tip}
              onChange={(e) => update(idx, { tip: e.target.value })}
              placeholder="Consiglio personale (opz.)"
              className="mt-2 border rounded-xl px-3 py-2 w-full"
              style={{ borderColor: C.gold, color: C.primaryDark }}
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
                >
                  Su
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, +1)}
                  className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                  style={{ borderColor: C.gold, color: C.primaryDark }}
                >
                  Giù
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                style={{ borderColor: C.gold, color: C.primaryDark }}
              >
                Rimuovi
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
