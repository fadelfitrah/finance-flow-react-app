import { useEffect, useState } from "react";
import {
  Check,
  CreditCard,
  Eye,
  EyeOff,
  LayoutDashboard,
  LoaderCircle,
  Palette,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";

const PREFERENCES_KEY = "financeflow_preferences";

const defaultPreferences = {
  appearance: "system",
  defaultDashboardView: "overview",
  billingEmail: "",
};

const Settings = () => {
  const { user, updateProfile } = useAuth();
  return (
    <SettingsContent
      key={user?.email || "anonymous"}
      user={user}
      updateProfile={updateProfile}
    />
  );
};

const readPreferences = (email) => {
  try {
    const savedPreferences = JSON.parse(
      localStorage.getItem(PREFERENCES_KEY) || "{}",
    );
    return {
      ...defaultPreferences,
      ...savedPreferences,
      billingEmail: savedPreferences.billingEmail || email || "",
    };
  } catch {
    return { ...defaultPreferences, billingEmail: email || "" };
  }
};

const SettingsContent = ({ user, updateProfile }) => {
  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState(user?.fullName || user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [preferences, setPreferences] = useState(() =>
    readPreferences(user?.email),
  );
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.appearance;
  }, [preferences.appearance]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ email, fullName, currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Profil berhasil diperbarui.");
    } catch (error) {
      toast.error(error.message || "Profil gagal diperbarui.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    document.documentElement.dataset.theme = preferences.appearance;
    window.setTimeout(() => {
      setSavingPreferences(false);
      toast.success("Preferensi berhasil disimpan di perangkat ini.");
    }, 250);
  };

  const updatePreferences = (updates) =>
    setPreferences((current) => ({ ...current, ...updates }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold text-blue-700">Pengaturan akun</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Kelola profil, preferensi aplikasi, dan informasi tagihan Anda.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><UserRound size={19} /></span>
          <div><h2 className="font-semibold text-slate-900">Profile settings</h2><p className="mt-1 text-sm text-slate-500">Perbarui nama, email, atau kata sandi akun Anda.</p></div>
        </div>
        <form onSubmit={saveProfile} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Nama pengguna<input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength="2" maxLength="100" className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Alamat email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          <label className="text-sm font-medium text-slate-700">Kata sandi saat ini<input type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Wajib bila mengganti kata sandi" className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          <label className="text-sm font-medium text-slate-700">Kata sandi baru<input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="6" placeholder="Minimal 6 karakter" className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          <button type="button" onClick={() => setShowPasswords((value) => !value)} className="inline-flex w-fit items-center gap-2 text-sm text-slate-600 hover:text-blue-700 md:col-span-2">{showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}{showPasswords ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}</button>
          <div className="md:col-span-2"><button type="submit" disabled={savingProfile} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{savingProfile ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{savingProfile ? "Menyimpan..." : "Simpan profil"}</button></div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><Palette size={19} /></span><div><h2 className="font-semibold text-slate-900">Preferences</h2><p className="mt-1 text-sm text-slate-500">Atur tampilan dan halaman dashboard pilihan Anda.</p></div></div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <fieldset><legend className="text-sm font-medium text-slate-700">Appearance settings</legend><div className="mt-2 grid grid-cols-3 gap-2">{[["system", "Sistem"], ["light", "Terang"], ["dark", "Gelap"]].map(([value, label]) => <button key={value} type="button" onClick={() => updatePreferences({ appearance: value })} className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${preferences.appearance === value ? "border-violet-600 bg-violet-50 text-violet-800" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>{preferences.appearance === value && <Check className="mr-1 inline" size={14} />}{label}</button>)}</div><p className="mt-2 text-xs text-slate-500">Pilihan disimpan untuk browser/perangkat ini.</p></fieldset>
          <fieldset><legend className="text-sm font-medium text-slate-700">Default Dashboard View</legend><div className="mt-2 space-y-2">{[["overview", "Ringkasan", "Tampilkan gambaran keuangan saat membuka dashboard."], ["finance", "Keuangan", "Prioritaskan transaksi dan arus kas."], ["inventory", "Inventori", "Prioritaskan stok barang."]].map(([value, label, description]) => <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${preferences.defaultDashboardView === value ? "border-violet-600 bg-violet-50" : "border-slate-200"}`}><input type="radio" name="dashboard-view" checked={preferences.defaultDashboardView === value} onChange={() => updatePreferences({ defaultDashboardView: value })} className="mt-1 accent-violet-700" /><span><span className="text-sm font-medium text-slate-800">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span></label>)}</div></fieldset>
        </div>
        <button type="button" onClick={savePreferences} disabled={savingPreferences} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">{savingPreferences ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{savingPreferences ? "Menyimpan..." : "Simpan preferensi"}</button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><CreditCard size={19} /></span><div><h2 className="font-semibold text-slate-900">Billing Settings</h2><p className="mt-1 text-sm text-slate-500">Informasi tagihan untuk akun FinanceFlow Anda.</p></div></div>
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end"><label className="text-sm font-medium text-slate-700">Email penagihan<input type="email" value={preferences.billingEmail} onChange={(event) => updatePreferences({ billingEmail: event.target.value })} className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><button type="button" onClick={savePreferences} disabled={savingPreferences} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"><Save size={16} />Simpan email</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paket saat ini</p><p className="mt-1 flex items-center gap-2 font-semibold text-slate-900"><LayoutDashboard size={17} className="text-blue-700" />Free</p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status penagihan</p><p className="mt-1 flex items-center gap-2 font-semibold text-emerald-700"><ShieldCheck size={17} />Tidak ada tagihan aktif</p></div></div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Integrasi pembayaran belum dikonfigurasi; halaman ini menyimpan email penagihan dan menampilkan status paket saat ini.</p>
      </section>
    </div>
  );
};

export default Settings;
