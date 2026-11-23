"use client";
import { useGame } from "@/lib/store";
import { Toggle } from "./UI";
import { Volume2, Monitor, Gamepad2, Check, Camera } from "lucide-react";
import { sound } from "@/lib/audio";
export default function Settings({ onDone }: { onDone: () => void }) {
  const { save, setSettings } = useGame();
  const s = save.settings;
  return (
    <div className="settings">
      <h3 className="group-label">
        <Volume2 size={17} />
        Suara petualangan
      </h3>
      <label className="field range-label">
        <span>
          Volume <b>{s.volume}%</b>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={s.volume}
          onChange={(e) => setSettings({ volume: +e.target.value })}
          onPointerUp={() => sound("star")}
        />
      </label>
      <Toggle
        label="Efek suara"
        value={s.effects}
        onChange={(effects) => setSettings({ effects })}
      />
      <Toggle
        label="Musik latar"
        description="Melodi orisinal yang ceria."
        value={s.music}
        onChange={(music) => {
          setSettings({ music });
          sound("click");
        }}
      />
      <Toggle
        label="Matikan semua suara"
        value={s.mute}
        onChange={(mute) => setSettings({ mute })}
      />
      <h3 className="group-label">
        <Monitor size={17} />
        Tampilan & aksesibilitas
      </h3>
      <Toggle
        label="Kurangi gerakan"
        description="Kurangi efek melayang dan animasi hiasan."
        value={s.reduceMotion}
        onChange={(reduceMotion) => setSettings({ reduceMotion })}
      />
      <label className="field">
        Kualitas grafis
        <select
          value={s.quality}
          onChange={(e) =>
            setSettings({ quality: e.target.value as "hemat" | "tinggi" })
          }
        >
          <option value="tinggi">Tinggi · dengan bayangan</option>
          <option value="hemat">Hemat · untuk perangkat ringan</option>
        </select>
      </label>
      <h3 className="group-label">
        <Gamepad2 size={17} />
        Kontrol Number Bot
      </h3>
      <Toggle
        label="Lompatan ganda"
        description="Tekan lompat lagi saat berada di udara."
        value={s.doubleJump}
        onChange={(doubleJump) => setSettings({ doubleJump })}
      />
      <label className="field range-label">
        <span>
          Kecepatan kamera <b>{s.camera}%</b>
        </span>
        <input
          type="range"
          min="10"
          max="100"
          value={s.camera}
          onChange={(e) => setSettings({ camera: +e.target.value })}
        />
      </label>
      <div className="info-box">
        <Camera size={17} />
        Izin kamera dapat diubah melalui ikon pengaturan situs di bilah alamat
        browser. Kamera hanya aktif saat memindai.
      </div>
      <button className="btn primary full" onClick={onDone}>
        <Check size={17} />
        Selesai
      </button>
    </div>
  );
}
