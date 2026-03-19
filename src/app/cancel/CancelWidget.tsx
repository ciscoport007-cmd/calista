"use client";

import { useState } from "react";

type BookingData = {
  id: string;
  status: string;
  totalPrice: number;
  equipmentRental: boolean;
  coaching: boolean;
  timeSlot: { date: string; startTime: string; endTime: string };
  court: { name: string; type: string };
  user: { name: string; email: string };
};

export default function CancelWidget() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelResult, setCancelResult] = useState<{ message: string; isLate: boolean } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const lookupBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBooking(null);
    setCancelResult(null);
    try {
      const res = await fetch(`/api/cancel?ref=${encodeURIComponent(ref.trim())}&email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      setBooking(data.booking);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking) return;
    setCancelling(true);
    setError("");
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      setCancelResult({ message: data.message, isLate: data.isLateCancellation });
      setBooking(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  // Check if cancellation is within 24 hours
  const isLateCancellation = booking
    ? (new Date(`${booking.timeSlot.date}T${booking.timeSlot.startTime}:00`).getTime() - Date.now()) / (1000 * 60 * 60) < 24
    : false;

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-forest/10 p-8 shadow-xl">
      {!booking && !cancelResult && (
        <form onSubmit={lookupBooking} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs tracking-widest uppercase text-forest/70 mb-2">
              Booking Reference
            </label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. CTC-AB12CD"
              className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold uppercase tracking-widest"
              required
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-forest/70 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email used during booking"
              className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold"
              required
            />
          </div>
          {error && (
            <div className="p-3 border border-red-200 bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-cream py-3 font-sans tracking-widest uppercase text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
          >
            {loading ? "Looking up..." : "Find My Booking"}
          </button>
        </form>
      )}

      {booking && (
        <div className="font-sans animate-in fade-in duration-300">
          <h3 className="font-serif text-xl text-forest mb-6">Booking Found</h3>
          <div className="bg-cream p-5 border border-forest/10 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-forest/60">Court</span>
              <span className="font-medium">{booking.court.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Date</span>
              <span className="font-medium">{booking.timeSlot.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Time</span>
              <span className="font-medium">{booking.timeSlot.startTime} – {booking.timeSlot.endTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Guest</span>
              <span className="font-medium">{booking.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Status</span>
              <span className={`px-2 py-0.5 text-xs uppercase tracking-wide rounded font-medium ${
                booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {booking.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Total Paid</span>
              <span className="font-medium">€{booking.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <>
              {isLateCancellation && (
                <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 text-sm">
                  <strong>Late Cancellation Warning:</strong> This booking is within 24 hours. Cancelling now will incur the <strong>full charge</strong> as per our cancellation policy.
                </div>
              )}
              {!isLateCancellation && (
                <div className="mb-4 p-4 border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
                  Free cancellation available — more than 24 hours before your booking.
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-600 text-sm">{error}</div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setBooking(null); setRef(""); setEmail(""); }}
                  className="flex-1 py-3 border border-forest/20 text-forest font-sans tracking-widest uppercase text-sm hover:border-forest transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={cancelBooking}
                  disabled={cancelling}
                  className="flex-1 py-3 bg-red-600 text-white font-sans tracking-widest uppercase text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </button>
              </div>
            </>
          )}

          {(booking.status === "cancelled" || booking.status === "completed") && (
            <button
              onClick={() => { setBooking(null); setRef(""); setEmail(""); }}
              className="w-full py-3 border border-forest/20 text-forest font-sans tracking-widest uppercase text-sm hover:border-forest transition-colors"
            >
              Search Another Booking
            </button>
          )}
        </div>
      )}

      {cancelResult && (
        <div className="text-center py-8 animate-in fade-in duration-300">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cancelResult.isLate ? "bg-orange-100" : "bg-green-100"}`}>
            <svg className={`w-8 h-8 ${cancelResult.isLate ? "text-orange-600" : "text-green-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-serif text-xl text-forest mb-3">Booking Cancelled</h3>
          <p className="font-sans text-forest/70 text-sm mb-6">{cancelResult.message}</p>
          <button
            onClick={() => { setCancelResult(null); setRef(""); setEmail(""); }}
            className="bg-gold hover:bg-gold-light text-forest px-6 py-2 font-sans tracking-widest uppercase text-sm transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
