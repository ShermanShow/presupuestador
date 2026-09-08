"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Vendedor } from "@/config/empresa";

type AdminVendedor = Vendedor & { activo: boolean };
type Form = { nombre: string; email: string; telefono: string };
const emptyForm: Form = { nombre: "", email: "", telefono: "" };

export default function AdminVendedores() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [vendedores, setVendedores] = useState<AdminVendedor[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [editing, setEditing] = useState<AdminVendedor | null>(null);
  const [message, setMessage] = useState("");

  async function load(nextPassword = password) {
    const response = await fetch("/api/vendedores", { headers: { "x-admin-password": nextPassword } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No autorizado");
    setVendedores(data.vendedores || []);
  }
  async function unlock(event: FormEvent) { event.preventDefault(); try { await load(); setUnlocked(true); } catch { setMessage("Clave incorrecta."); } }
  useEffect(() => { if (unlocked) load().catch((error) => setMessage(error.message)); }, [unlocked]);
  async function save(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/vendedores", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "No se pudo guardar"); return; }
    setForm(emptyForm); setEditing(null); setMessage(editing ? "Vendedor actualizado." : "Vendedor agregado."); await load();
  }
  async function deactivate(vendedor: AdminVendedor) {
    if (!window.confirm(`¿Desactivar a ${vendedor.nombre}?`)) return;
    const response = await fetch(`/api/vendedores?id=${vendedor.id}`, { method: "DELETE", headers: { "x-admin-password": password } });
    if (response.ok) { setMessage("Vendedor desactivado."); await load(); } else setMessage("No se pudo desactivar.");
  }

  if (!unlocked) return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4"><form onSubmit={unlock} className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h1 className="text-xl font-bold text-gray-800">Administración</h1><p className="mt-1 text-sm text-gray-500">Ingresá la clave para administrar vendedores.</p><input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Clave" className="mt-5 w-full rounded-lg border border-gray-200 px-3 py-2" /><button className="mt-3 w-full rounded-lg bg-[#E85500] px-4 py-2 font-semibold text-white">Ingresar</button>{message && <p className="mt-3 text-sm text-red-600">{message}</p>}</form></main>;
  return <main className="min-h-screen bg-gray-50 px-4 py-8"><div className="mx-auto max-w-4xl"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Administrar vendedores</h1><p className="text-sm text-gray-500">Las altas aparecerán en el presupuestador automáticamente.</p></div><a href="/" className="text-sm font-semibold text-orange-700">Volver al presupuestador</a></div><div className="grid gap-5 md:grid-cols-[320px_1fr]"><form onSubmit={save} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-bold">{editing ? "Editar vendedor" : "Nuevo vendedor"}</h2>{([['nombre','Nombre'],['email','Mail'],['telefono','Teléfono']] as const).map(([key,label]) => <label key={key} className="mt-4 block text-sm font-semibold text-gray-600">{label}<input required type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-normal" /></label>)}<button className="mt-5 w-full rounded-lg bg-[#E85500] px-4 py-2 font-semibold text-white">{editing ? "Guardar cambios" : "Dar de alta"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="mt-2 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">Cancelar edición</button>}{message && <p className="mt-3 text-sm text-gray-600">{message}</p>}</form><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Vendedores cargados</h2><div className="mt-4 divide-y divide-gray-100">{vendedores.map((vendedor) => <div key={vendedor.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold text-gray-800">{vendedor.nombre} {!vendedor.activo && <span className="text-xs text-red-600">(inactivo)</span>}</p><p className="text-sm text-gray-500">{vendedor.email} · {vendedor.telefono}</p></div><div className="flex gap-2"><button onClick={() => { setEditing(vendedor); setForm({ nombre: vendedor.nombre, email: vendedor.email, telefono: vendedor.telefono }); }} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold">Editar</button>{vendedor.activo && <button onClick={() => deactivate(vendedor)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Desactivar</button>}</div></div>)}</div></section></div></div></main>;
}
