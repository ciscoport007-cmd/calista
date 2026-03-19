"use client";

import { useState } from "react";
import { updateBookingStatus, blockTimeSlot, unblockTimeSlot, updateCourtPrice, updateSetting } from "./actions";
import { format } from "date-fns";

type Booking = any;
type Slot = any;
type Court = any;
type DailyRevenue = { date: string; revenue: number };

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00", "23:00",
];

const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  pending: "Pending",
};

const COURT_TYPE_BADGE: Record<string, string> = {
  hard: "bg-slate-100 text-slate-700",
  clay: "bg-orange-100 text-orange-700",
  padel: "bg-emerald-100 text-emerald-700",
};

type PendingChange = {
  bookingId: string;
  guestName: string;
  oldStatus: string;
  newStatus: string;
};

export default function AdminDashboard({
  bookings,
  blockedSlots,
  courts,
  totalRevenue,
  todayRevenue,
  weekRevenue,
  dailyRevenue,
  settings,
  roomMap,
}: {
  bookings: Booking[];
  blockedSlots: Slot[];
  courts: Court[];
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  dailyRevenue: DailyRevenue[];
  settings: Record<string, string>;
  roomMap: Record<string, string>;
}) {
  const [tab, setTab] = useState("bookings");

  // Pending status changes (not yet applied)
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, string>>(
    Object.fromEntries(bookings.map((b: Booking) => [b.id, b.status]))
  );
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState("");

  // Court Prices
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(courts.map((c: Court) => [c.id, String(c.basePrice)]))
  );
  const [savingPrice, setSavingPrice] = useState<string | null>(null);
  const [priceMsg, setPriceMsg] = useState<Record<string, string>>({});

  // Settings
  const [equipmentPrice, setEquipmentPrice] = useState(settings["equipmentPrice"] ?? "30");
  const [professionalEquipmentPrice, setProfessionalEquipmentPrice] = useState(settings["professionalEquipmentPrice"] ?? "50");
  const [ballsOnlyPrice, setBallsOnlyPrice] = useState(settings["ballsOnlyPrice"] ?? "10");
  const [coachingPrice, setCoachingPrice] = useState(settings["coachingPrice"] ?? "120");
  const [professionalCoachingPrice, setProfessionalCoachingPrice] = useState(settings["professionalCoachingPrice"] ?? "180");
  const [gmailUser, setGmailUser] = useState(settings["gmailUser"] ?? "");
  const [gmailPass, setGmailPass] = useState(settings["gmailPass"] ?? "");
  const [showPass, setShowPass] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  // Slot management
  const [blockDate, setBlockDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [blockTime, setBlockTime] = useState("07:00");
  const [blockCourtId, setBlockCourtId] = useState(courts[1]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("all");

  // Handle dropdown change — adds to pending list (not saved yet)
  const handleStatusSelect = (booking: Booking, newStatus: string) => {
    const oldStatus = booking.status;
    if (newStatus === oldStatus) {
      // Revert: remove from pending
      setPendingStatuses((prev) => ({ ...prev, [booking.id]: oldStatus }));
      setPendingChanges((prev) => prev.filter((c) => c.bookingId !== booking.id));
      return;
    }
    setPendingStatuses((prev) => ({ ...prev, [booking.id]: newStatus }));
    setPendingChanges((prev) => {
      const filtered = prev.filter((c) => c.bookingId !== booking.id);
      return [...filtered, { bookingId: booking.id, guestName: booking.user.name, oldStatus, newStatus }];
    });
    setApplyResult("");
  };

  // Apply all pending changes — saves to DB and sends emails
  const handleApplyChanges = async () => {
    setApplying(true);
    setApplyResult("");
    for (const change of pendingChanges) {
      await updateBookingStatus(change.bookingId, change.newStatus);
    }
    setApplyResult(`${pendingChanges.length} change(s) applied. Emails sent.`);
    setPendingChanges([]);
    setApplying(false);
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await blockTimeSlot(blockCourtId, blockDate, blockTime);
    setIsSubmitting(false);
  };

  const handleUnblock = async (id: string) => {
    await unblockTimeSlot(id);
  };

  const handlePriceSave = async (courtId: string) => {
    setSavingPrice(courtId);
    setPriceMsg((prev) => ({ ...prev, [courtId]: "" }));
    const val = parseFloat(prices[courtId]);
    const result = await updateCourtPrice(courtId, val);
    setPriceMsg((prev) => ({
      ...prev,
      [courtId]: result.error ? `Error: ${result.error}` : "Saved ✓",
    }));
    setSavingPrice(null);
  };

  const handleSettingsSave = async () => {
    setSavingSettings(true);
    setSettingsMsg("");
    await Promise.all([
      updateSetting("equipmentPrice", equipmentPrice),
      updateSetting("professionalEquipmentPrice", professionalEquipmentPrice),
      updateSetting("ballsOnlyPrice", ballsOnlyPrice),
      updateSetting("coachingPrice", coachingPrice),
      updateSetting("professionalCoachingPrice", professionalCoachingPrice),
      updateSetting("gmailUser", gmailUser),
      updateSetting("gmailPass", gmailPass),
    ]);
    setSettingsMsg("Saved ✓");
    setSavingSettings(false);
  };

  const filteredBookings = bookings.filter((b: Booking) => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const matchCourt = courtFilter === "all" || b.courtId === courtFilter;
    return matchStatus && matchCourt;
  });

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  return (
    <div className="min-h-screen bg-cream text-forest font-sans pb-32">
      <nav className="w-full bg-forest text-cream px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-serif tracking-widest uppercase">Admin Dashboard</h1>
        <a href="/" className="text-cream/60 hover:text-cream text-sm tracking-widest uppercase transition-colors">
          ← Site
        </a>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-forest/20 overflow-x-auto">
          {[
            { key: "bookings", label: "All Bookings" },
            { key: "slots", label: "Manage Slots" },
            { key: "prices", label: "Court Prices" },
            { key: "settings", label: "Settings" },
            { key: "revenue", label: "Revenue" },
          ].map((t) => (
            <button
              key={t.key}
              className={`pb-4 px-2 tracking-widest uppercase text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "border-b-2 border-gold text-forest"
                  : "text-forest/60 hover:text-forest"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === "bookings" && pendingChanges.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {pendingChanges.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Bookings Tab ─── */}
        {tab === "bookings" && (
          <div className="bg-white border border-forest/10 p-6 shadow-xl">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-forest/20 p-2 text-sm bg-transparent focus:outline-none focus:border-gold"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
                className="border border-forest/20 p-2 text-sm bg-transparent focus:outline-none focus:border-gold"
              >
                <option value="all">All Courts</option>
                {courts.map((c: Court) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="ml-auto text-sm text-forest/50 self-center">
                {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-forest/10 text-xs tracking-widest uppercase text-forest/60">
                    <th className="pb-3 pr-3 font-normal">Date & Time</th>
                    <th className="pb-3 pr-3 font-normal">Court</th>
                    <th className="pb-3 pr-3 font-normal">Guest</th>
                    <th className="pb-3 pr-3 font-normal">Phone</th>
                    <th className="pb-3 pr-3 font-normal">Room</th>
                    <th className="pb-3 pr-3 font-normal">Add-ons</th>
                    <th className="pb-3 pr-3 font-normal">Total</th>
                    <th className="pb-3 pr-3 font-normal">Status</th>
                    <th className="pb-3 font-normal">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b: Booking) => {
                    const currentDisplay = pendingStatuses[b.id] ?? b.status;
                    const hasPending = pendingStatuses[b.id] && pendingStatuses[b.id] !== b.status;
                    return (
                      <tr
                        key={b.id}
                        className={`border-b border-forest/5 last:border-0 hover:bg-cream/50 ${hasPending ? "bg-amber-50/40" : ""}`}
                      >
                        <td className="py-3 pr-3">
                          <div className="font-medium">{b.timeSlot.date}</div>
                          <div className="text-forest/60">{b.timeSlot.startTime}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded tracking-wide ${COURT_TYPE_BADGE[b.court?.type] ?? "bg-gray-100 text-gray-600"}`}>
                            {b.court?.name ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-medium">{b.user.name}</div>
                          <div className="text-forest/60 text-xs">{b.user.email}</div>
                        </td>
                        <td className="py-3 pr-3 text-forest/70">
                          {b.user.phone || <span className="text-forest/30">—</span>}
                        </td>
                        <td className="py-3 pr-3 text-forest/70">
                          {roomMap[b.id] || <span className="text-forest/30">—</span>}
                        </td>
                        <td className="py-3 pr-3 text-xs space-y-0.5">
                          {b.equipmentRental       && <div>Premium Equip.</div>}
                          {b.professionalEquipment && <div>Pro Equip.</div>}
                          {b.ballsOnly             && <div>Balls Only</div>}
                          {b.coaching              && <div>Coaching</div>}
                          {b.professionalCoaching  && <div>Pro Coaching</div>}
                          {!b.equipmentRental && !b.professionalEquipment && !b.ballsOnly && !b.coaching && !b.professionalCoaching && <span className="text-forest/30">—</span>}
                        </td>
                        <td className="py-3 pr-3 font-medium">€{b.totalPrice.toFixed(2)}</td>
                        <td className="py-3 pr-3">
                          <span className={`px-2 py-1 text-xs uppercase tracking-wider rounded ${STATUS_BADGE[currentDisplay] ?? "bg-gray-100"}`}>
                            {STATUS_LABEL[currentDisplay] ?? currentDisplay}
                          </span>
                          {hasPending && (
                            <div className="text-xs text-amber-600 mt-1">← pending</div>
                          )}
                        </td>
                        <td className="py-3">
                          <select
                            className="border border-forest/20 p-1 text-sm bg-transparent focus:outline-none focus:border-gold"
                            value={currentDisplay}
                            onChange={(e) => handleStatusSelect(b, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-forest/40 text-sm">
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Manage Slots Tab ─── */}
        {tab === "slots" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-forest/10 p-6 shadow-xl h-fit">
              <h2 className="text-xl font-serif mb-6">Block a Time Slot</h2>
              <form onSubmit={handleBlockSlot} className="space-y-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-forest/70 mb-2">Court</label>
                  <select
                    value={blockCourtId}
                    onChange={(e) => setBlockCourtId(e.target.value)}
                    className="w-full p-2 border border-forest/20 focus:outline-none focus:border-gold"
                  >
                    {courts
                      .filter((c: Court) => c.isActive && !c.isFull)
                      .map((c: Court) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-forest/70 mb-2">Date</label>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full p-2 border border-forest/20 focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-forest/70 mb-2">Time</label>
                  <select
                    value={blockTime}
                    onChange={(e) => setBlockTime(e.target.value)}
                    className="w-full p-2 border border-forest/20 focus:outline-none focus:border-gold"
                  >
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-forest hover:bg-forest-light text-cream py-3 tracking-widest uppercase text-sm transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? "Blocking..." : "Block Slot"}
                </button>
              </form>
            </div>

            <div className="bg-white border border-forest/10 p-6 shadow-xl">
              <h2 className="text-xl font-serif mb-6">Currently Blocked Slots</h2>
              <div className="space-y-3">
                {blockedSlots.map((s: Slot) => (
                  <div key={s.id} className="flex justify-between items-center border border-forest/10 p-3 bg-red-50/50">
                    <div>
                      <div className="text-xs text-forest/50 mb-1">{s.court?.name}</div>
                      <span className="font-medium mr-4 text-sm">{s.date}</span>
                      <span className="text-forest/70 text-sm">{s.startTime} – {s.endTime}</span>
                    </div>
                    <button
                      onClick={() => handleUnblock(s.id)}
                      className="text-red-600 hover:text-red-800 text-xs tracking-widest uppercase"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
                {blockedSlots.length === 0 && (
                  <p className="text-forest/50 text-sm">No slots currently blocked.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Court Prices Tab ─── */}
        {tab === "prices" && (
          <div className="bg-white border border-forest/10 p-6 shadow-xl max-w-2xl">
            <h2 className="text-xl font-serif mb-2">Court Prices</h2>
            <p className="text-sm text-forest/60 font-sans mb-6">
              Base prices per 60-minute session. Service charge (10%) and GST (9%) are added automatically.
            </p>
            <div className="space-y-4">
              {courts.map((c: Court) => (
                <div key={c.id} className="flex items-center gap-4 border border-forest/10 p-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-forest/50 uppercase tracking-widest flex items-center gap-2">
                      {c.type}
                      {c.isFull && (
                        <span className="bg-red-100 text-red-600 px-1.5 rounded">Full</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-forest/60 font-sans text-sm">€</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={prices[c.id] ?? c.basePrice}
                      onChange={(e) =>
                        setPrices((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      className="w-24 p-2 border border-forest/20 focus:outline-none focus:border-gold text-sm text-right"
                    />
                    <button
                      onClick={() => handlePriceSave(c.id)}
                      disabled={savingPrice === c.id}
                      className="px-4 py-2 bg-forest text-cream text-xs tracking-widest uppercase hover:bg-forest-light transition-colors disabled:opacity-50"
                    >
                      {savingPrice === c.id ? "..." : "Save"}
                    </button>
                  </div>
                  {priceMsg[c.id] && (
                    <span className={`text-xs ${priceMsg[c.id].startsWith("Error") ? "text-red-600" : "text-emerald-600"}`}>
                      {priceMsg[c.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {tab === "settings" && (
          <div className="max-w-xl space-y-8">
            <div className="bg-white border border-forest/10 p-6 shadow-xl">
              <h2 className="text-xl font-serif mb-2">Add-on Service Prices</h2>
              <p className="text-sm text-forest/60 mb-6">
                Prices shown to guests at checkout and used in total calculations.
              </p>
              <div className="space-y-3">
                <p className="text-xs tracking-widest uppercase text-forest/40 pb-1 border-b border-forest/10">Equipment</p>
                {[
                  { label: "Premium Equipment Rental (€)", value: equipmentPrice, set: setEquipmentPrice },
                  { label: "Professional Equipment Rental (€)", value: professionalEquipmentPrice, set: setProfessionalEquipmentPrice },
                  { label: "Ball Package (€)", value: ballsOnlyPrice, set: setBallsOnlyPrice },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs tracking-widest uppercase text-forest/70 mb-1">{f.label}</label>
                    <input type="number" min="0" step="1" value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold text-sm" />
                  </div>
                ))}
                <p className="text-xs tracking-widest uppercase text-forest/40 pb-1 border-b border-forest/10 pt-2">Coaching</p>
                {[
                  { label: "Private Coaching Session (€)", value: coachingPrice, set: setCoachingPrice },
                  { label: "Professional Coaching Session (€)", value: professionalCoachingPrice, set: setProfessionalCoachingPrice },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs tracking-widest uppercase text-forest/70 mb-1">{f.label}</label>
                    <input type="number" min="0" step="1" value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold text-sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-forest/10 p-6 shadow-xl">
              <h2 className="text-xl font-serif mb-2">Gmail Email Settings</h2>
              <p className="text-sm text-forest/60 mb-1">
                Emails are sent from this Gmail account via SMTP.
              </p>
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <strong>Önemli:</strong> Normal Gmail şifresi değil, <strong>Uygulama Şifresi (App Password)</strong> kullanılmalıdır.{" "}
                Gmail → Google Hesabı → Güvenlik → 2 Adımlı Doğrulama açık olmalı, ardından{" "}
                <strong>Uygulama Şifreleri</strong> bölümünden 16 haneli şifre oluşturun.
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-forest/70 mb-2">Gmail Adresi</label>
                  <input
                    type="email"
                    value={gmailUser}
                    onChange={(e) => setGmailUser(e.target.value)}
                    placeholder="ornek@gmail.com"
                    className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-forest/70 mb-2">
                    Uygulama Şifresi (App Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={gmailPass}
                      onChange={(e) => setGmailPass(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold text-sm pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-forest/50 hover:text-forest tracking-widest uppercase"
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSettingsSave}
                disabled={savingSettings}
                className="bg-forest text-cream px-8 py-3 font-sans tracking-widest uppercase text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
              >
                {savingSettings ? "Saving..." : "Save All Settings"}
              </button>
              {settingsMsg && <span className="text-emerald-600 text-sm">{settingsMsg}</span>}
            </div>
          </div>
        )}

        {/* ─── Revenue Tab ─── */}
        {tab === "revenue" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Today", value: todayRevenue },
                { label: "This Week", value: weekRevenue },
                { label: "All Time", value: totalRevenue },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-forest/10 p-6 shadow-xl text-center">
                  <span className="block text-xs tracking-widest uppercase text-forest/60 mb-2">{item.label}</span>
                  <span className="text-4xl font-serif text-forest">
                    €{item.value.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-white border border-forest/10 p-6 shadow-xl">
              <h2 className="text-xl font-serif mb-6">Last 7 Days</h2>
              <div className="flex items-end gap-3 h-40">
                {dailyRevenue.map((d) => {
                  const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs text-forest/60 font-mono">
                        {d.revenue > 0 ? `€${d.revenue.toFixed(0)}` : "—"}
                      </span>
                      <div className="w-full bg-cream relative" style={{ height: "80px" }}>
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-gold/70 transition-all duration-500"
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-forest/50">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-forest/10 p-6 shadow-xl">
              <h2 className="text-xl font-serif mb-6">Revenue by Court</h2>
              <div className="space-y-3">
                {courts.map((c: Court) => {
                  const courtRevenue = bookings
                    .filter((b: Booking) => b.courtId === c.id && b.status !== "cancelled")
                    .reduce((sum: number, b: Booking) => sum + b.totalPrice, 0);
                  const courtBookings = bookings.filter(
                    (b: Booking) => b.courtId === c.id && b.status !== "cancelled"
                  ).length;
                  return (
                    <div key={c.id} className="flex items-center justify-between border-b border-forest/5 pb-3 last:border-0">
                      <div>
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-xs text-forest/50 ml-2">({courtBookings} bookings)</span>
                      </div>
                      <span className="font-serif text-forest">€{courtRevenue.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Sticky Confirmation Bar ─── */}
      {pendingChanges.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-forest text-cream shadow-2xl border-t-2 border-gold">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-sans font-medium text-sm tracking-wide">
                {pendingChanges.length} pending status change{pendingChanges.length > 1 ? "s" : ""}
              </p>
              <p className="text-cream/60 text-xs mt-0.5">
                {pendingChanges.map((c) => `${c.guestName}: ${STATUS_LABEL[c.oldStatus]} → ${STATUS_LABEL[c.newStatus]}`).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setPendingStatuses(Object.fromEntries(bookings.map((b: Booking) => [b.id, b.status])));
                  setPendingChanges([]);
                }}
                className="text-cream/70 hover:text-cream text-sm tracking-widest uppercase px-4 py-2 border border-cream/20 hover:border-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyChanges}
                disabled={applying}
                className="bg-gold hover:bg-gold-light text-forest px-6 py-2 font-sans font-medium tracking-widest uppercase text-sm transition-colors disabled:opacity-60"
              >
                {applying ? "Applying..." : "Confirm & Send Email"}
              </button>
            </div>
          </div>
          {applyResult && (
            <div className="bg-emerald-700 text-white text-center text-xs py-1.5 font-sans tracking-wide">
              {applyResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
