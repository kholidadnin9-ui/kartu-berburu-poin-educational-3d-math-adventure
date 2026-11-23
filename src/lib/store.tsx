"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  newSave,
  saveSchema,
  uid,
  type Save,
  type Player,
  type Settings,
} from "./game";
const KEY = "number-jump.classroom.v1";
type Store = {
  save: Save;
  player: Player;
  ready: boolean;
  sync: string;
  change: (fn: (s: Save) => Save) => void;
  updatePlayer: (fn: (p: Player) => Player) => void;
  setSettings: (v: Partial<Settings>) => void;
  notify: (t: string) => void;
  notice: string;
};
const Ctx = createContext<Store | null>(null);
export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<Save>(newSave),
    [ready, setReady] = useState(false),
    [sync, setSync] = useState("Tersimpan lokal"),
    [notice, setNotice] = useState("");
  const token = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((t: string) => {
    setNotice(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 4500);
  }, []);
  useEffect(() => {
    let live = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = saveSchema.safeParse(JSON.parse(raw));
        if (p.success) setSave(p.data);
        else
          notify(
            "Simpanan tidak dapat dibaca. Pulihkan cadangan melalui Ruang Guru.",
          );
      }
      let t = localStorage.getItem(KEY + ".key");
      if (!t) {
        t = uid() + "-" + uid();
        localStorage.setItem(KEY + ".key", t);
      }
      token.current = t;
      fetch("/api/progress", { headers: { Authorization: "Bearer " + t } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!live || !data?.state) return;
          const result = saveSchema.safeParse(data.state);
          if (result.success)
            setSave((s) =>
              result.data.updatedAt > s.updatedAt ? result.data : s,
            );
        })
        .catch(() => {});
    } catch {
      notify("Penyimpanan perangkat terbatas. Gunakan cadangan di Ruang Guru.");
    }
    setReady(true);
    return () => {
      live = false;
    };
  }, [notify]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
      setSync("Tersimpan di perangkat");
    } catch {
      setSync("Penyimpanan penuh · buat cadangan");
    }
    const abort = new AbortController();
    const syncNow = () => {
      if (token.current)
        fetch("/api/progress", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token.current,
          },
          body: JSON.stringify(save),
          signal: abort.signal,
        })
          .then((r) => {
            if (r.ok) setSync("Progres tersimpan");
          })
          .catch(() => {});
    };
    const id = setTimeout(syncNow, 550);
    window.addEventListener("online", syncNow);
    return () => {
      clearTimeout(id);
      abort.abort();
      window.removeEventListener("online", syncNow);
    };
  }, [save, ready]);
  useEffect(() => {
    const fn = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue)
        try {
          const r = saveSchema.safeParse(JSON.parse(e.newValue));
          if (r.success)
            setSave((s) => (r.data.updatedAt > s.updatedAt ? r.data : s));
        } catch {}
    };
    window.addEventListener("storage", fn);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => window.removeEventListener("storage", fn);
  }, []);
  const change = useCallback(
    (fn: (s: Save) => Save) =>
      setSave((s) => ({
        ...fn(s),
        updatedAt: Math.max(Date.now(), s.updatedAt + 1),
      })),
    [],
  );
  const updatePlayer = useCallback(
    (fn: (p: Player) => Player) =>
      change((s) => ({
        ...s,
        players: s.players.map((p) => (p.id === s.active ? fn(p) : p)),
      })),
    [change],
  );
  const setSettings = useCallback(
    (v: Partial<Settings>) =>
      change((s) => ({ ...s, settings: { ...s.settings, ...v } })),
    [change],
  );
  return (
    <Ctx.Provider
      value={{
        save,
        ready,
        sync,
        player:
          save.players.find((p) => p.id === save.active) ?? save.players[0],
        change,
        updatePlayer,
        setSettings,
        notify,
        notice,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
export function useGame() {
  const s = useContext(Ctx);
  if (!s) throw Error("Game provider required");
  return s;
}
