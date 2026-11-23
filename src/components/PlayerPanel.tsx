"use client";
import { useState } from "react";
import { Play, Check, Users, UserRound, Plus, ShieldCheck } from "lucide-react";
import { useGame } from "@/lib/store";
import { newPlayer, nextMission, startRun, isOpen } from "@/lib/game";
import { Avatar, Toggle } from "./UI";
export default function PlayerPanel({
  onDone,
  mission,
  play = true,
}: {
  onDone: () => void;
  mission?: number;
  play?: boolean;
}) {
  const { save, player, change } = useGame();
  const [selected, setSelected] = useState(player.id),
    [name, setName] = useState(player.name === "Penjelajah" ? "" : player.name),
    [avatar, setAvatar] = useState(player.avatar),
    [multi, setMulti] = useState(save.settings.multiplayer);
  const submit = () => {
    change((s) => {
      const old = s.players.find((p) => p.id === selected);
      let p = old ?? newPlayer(name, undefined, avatar);
      if (name.trim() && name.trim() !== p.name) {
        p =
          old && old.id === "penjelajah" && !old.scans.length && !old.points
            ? { ...old, name: name.trim().slice(0, 30) }
            : newPlayer(name, undefined, avatar);
      }
      p = { ...p, avatar };
      if (play)
        p = startRun(
          p,
          mission !== undefined && isOpen(p, mission)
            ? mission
            : nextMission(p),
        );
      return {
        ...s,
        active: p.id,
        players: s.players.some((a) => a.id === p.id)
          ? s.players.map((a) => (a.id === p.id ? p : a))
          : [...s.players, p],
        settings: { ...s.settings, multiplayer: multi },
      };
    });
    onDone();
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="modal-lead">
        Siapkan kartu fisikmu. Siapa yang akan bertualang?
      </p>
      <div className="profile-select">
        <Users size={17} />
        <select
          aria-label="Profil tersimpan"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            const p = save.players.find((x) => x.id === e.target.value);
            setName(p?.name ?? "");
            setAvatar(p?.avatar ?? 0);
          }}
        >
          {save.players.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name} · {p.points} poin
            </option>
          ))}
          <option value="new">＋ Pemain baru</option>
        </select>
      </div>
      <label className="field">
        Nama panggilan
        <input
          maxLength={30}
          placeholder="Contoh: Bima"
          value={name}
          required={selected === "new"}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <span className="field-title">Pilih Number Bot</span>
      <div className="avatar-choices">
        {["Emas", "Aqua", "Ungu"].map((v, i) => (
          <button
            type="button"
            key={v}
            className={avatar === i ? "chosen" : ""}
            onClick={() => setAvatar(i)}
          >
            <Avatar variant={i} size={61} />
            <span>{v}</span>
            {avatar === i && (
              <i>
                <Check size={11} />
              </i>
            )}
          </button>
        ))}
      </div>
      <Toggle
        label="Bermain bergantian"
        description="Ganti pemain setelah satu misi selesai."
        value={multi}
        onChange={setMulti}
      />
      <div className="info-box">
        <ShieldCheck size={17} />
        Progres dan bonus tersimpan untuk setiap pemain.
      </div>
      <button className="btn primary full" type="submit">
        {play ? (
          <Play size={17} fill="currentColor" />
        ) : (
          <UserRound size={17} />
        )}{" "}
        {play ? "Mulai Bermain" : "Gunakan Pemain"}
      </button>
      {!play && (
        <button
          className="text-button full"
          type="button"
          onClick={() => {
            setSelected("new");
            setName("");
            setAvatar(0);
          }}
        >
          <Plus size={15} />
          Buat profil baru
        </button>
      )}
    </form>
  );
}
