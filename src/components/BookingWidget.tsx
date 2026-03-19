"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";

type Court = {
  id: string;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
  isFull: boolean;
  basePrice: number;
};

const COURT_TYPE_LABEL: Record<string, string> = {
  hard: "Hard Court",
  clay: "Clay Court",
  padel: "Padel Court",
};

const COURT_TYPE_BADGE: Record<string, string> = {
  hard: "bg-slate-200 text-slate-700",
  clay: "bg-orange-100 text-orange-800",
  padel: "bg-emerald-100 text-emerald-800",
};

export default function BookingWidget() {
  const [step, setStep] = useState(1);

  // Step 1 — Court
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  // Step 2 — Date & Time
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState("");

  // Step 3 — Guest Details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState("2");
  const [roomNumber, setRoomNumber] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Step 4 — Add-ons
  const [equipment, setEquipment] = useState(false);
  const [professionalEquipment, setProfessionalEquipment] = useState(false);
  const [ballsOnly, setBallsOnly] = useState(false);
  const [coaching, setCoaching] = useState(false);
  const [professionalCoaching, setProfessionalCoaching] = useState(false);

  const [equipmentPrice, setEquipmentPrice] = useState(30);
  const [professionalEquipmentPrice, setProfessionalEquipmentPrice] = useState(50);
  const [ballsOnlyPrice, setBallsOnlyPrice] = useState(10);
  const [coachingPrice, setCoachingPrice] = useState(120);
  const [professionalCoachingPrice, setProfessionalCoachingPrice] = useState(180);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [errorString, setErrorString] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(addDays(new Date(), 2), "yyyy-MM-dd");

  // Load courts and pricing on mount
  useEffect(() => {
    fetch("/api/courts")
      .then((r) => r.json())
      .then((d) => setCourts(d.courts || []));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setEquipmentPrice(d.equipmentPrice ?? 30);
        setProfessionalEquipmentPrice(d.professionalEquipmentPrice ?? 50);
        setBallsOnlyPrice(d.ballsOnlyPrice ?? 10);
        setCoachingPrice(d.coachingPrice ?? 120);
        setProfessionalCoachingPrice(d.professionalCoachingPrice ?? 180);
      });
  }, []);

  // Fetch slots when date or court changes
  useEffect(() => {
    if (!selectedCourt) return;
    setLoadingSlots(true);
    setTime("");
    fetch(`/api/slots?date=${date}&courtId=${selectedCourt.id}`)
      .then((r) => r.json())
      .then((d) => setAvailableSlots(d.slots || []))
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, [date, selectedCourt]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => { setStep((s) => Math.max(1, s - 1)); setErrorString(""); };

  const submitBooking = async () => {
    setIsSubmitting(true);
    setErrorString("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          courtId: selectedCourt!.id,
          name,
          email,
          phone,
          roomNumber,
          guests,
          equipment,
          professionalEquipment,
          ballsOnly,
          coaching,
          professionalCoaching,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setBookingRef(data.booking.id.split("-")[0].toUpperCase());
      handleNext();
    } catch (err: any) {
      setErrorString(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Price calc
  const base = selectedCourt?.basePrice ?? 50;
  const subtotal =
    base +
    (equipment             ? equipmentPrice             : 0) +
    (professionalEquipment ? professionalEquipmentPrice : 0) +
    (ballsOnly             ? ballsOnlyPrice             : 0) +
    (coaching              ? coachingPrice              : 0) +
    (professionalCoaching  ? professionalCoachingPrice  : 0);
  const serviceCharge = subtotal * 0.1;
  const gst = subtotal * 0.09;
  const total = subtotal + serviceCharge + gst;

  const isStep3Valid = name.trim() && email.trim() && phone.trim() && ageConfirmed;

  const STEPS = [
    { num: 1, label: "Court" },
    { num: 2, label: "Time" },
    { num: 3, label: "Details" },
    { num: 4, label: "Add-ons" },
    { num: 5, label: "Payment" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-forest/10 p-8 shadow-xl">
      {/* Step Indicator */}
      {step <= 5 && (
        <div className="flex items-center justify-between mb-8 border-b border-forest/10 pb-4">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${step >= s.num ? "text-forest" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm ${
                  step >= s.num ? "bg-forest text-cream" : "bg-gray-100"
                }`}
              >
                {s.num}
              </div>
              <span className="hidden sm:inline font-sans text-xs tracking-widest uppercase">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Step 1: Court Selection ─── */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-2xl font-serif text-forest mb-2">Select a Court</h3>
          <p className="text-sm font-sans text-forest/60 mb-8 tracking-wide">
            Choose the court that suits your game.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courts.map((court) => {
              const isDisabled = court.isFull || !court.isActive;
              const isSelected = selectedCourt?.id === court.id;
              return (
                <button
                  key={court.id}
                  onClick={() => !isDisabled && setSelectedCourt(court)}
                  disabled={isDisabled}
                  className={`relative text-left p-6 border transition-all duration-200 ${
                    isDisabled
                      ? "opacity-60 cursor-not-allowed border-gray-200 bg-gray-50"
                      : isSelected
                      ? "border-gold bg-gold/5 shadow-md"
                      : "border-forest/20 hover:border-gold/60 hover:shadow-sm"
                  }`}
                >
                  {isDisabled && (
                    <span className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs font-sans tracking-widest uppercase px-2 py-0.5">
                      Full
                    </span>
                  )}
                  {isSelected && !isDisabled && (
                    <span className="absolute top-3 right-3 bg-gold/20 text-forest text-xs font-sans tracking-widest uppercase px-2 py-0.5">
                      Selected
                    </span>
                  )}
                  <span
                    className={`inline-block text-xs font-sans tracking-widest uppercase px-2 py-0.5 rounded mb-3 ${
                      COURT_TYPE_BADGE[court.type] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {COURT_TYPE_LABEL[court.type] ?? court.type}
                  </span>
                  <h4 className="font-serif text-lg text-forest mb-1">{court.name}</h4>
                  <p className="text-sm text-forest/60 font-sans mb-3">{court.description}</p>
                  <p className="font-sans text-sm font-medium text-forest">
                    From €{court.basePrice.toFixed(0)} / hour
                  </p>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedCourt}
              className="bg-gold hover:bg-gold-light text-forest px-8 py-3 font-sans tracking-widest uppercase font-medium disabled:opacity-50 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Date & Time ─── */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-2xl font-serif text-forest mb-1">Select Date & Time</h3>
          <p className="text-sm font-sans text-forest/60 mb-8 tracking-wide">
            {selectedCourt?.name} · Available 06:00 – 23:00
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-sans tracking-widest uppercase text-forest/70 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                max={maxDate}
                className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold transition-colors font-sans"
              />
              <p className="text-xs text-forest/50 mt-1 font-sans">
                Bookings available for the next 3 days only.
              </p>
            </div>
            <div>
              <label className="block text-sm font-sans tracking-widest uppercase text-forest/70 mb-2">
                Time Slot
              </label>
              {loadingSlots ? (
                <div className="text-sm font-sans text-forest/50 py-2">Loading slots...</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                  {availableSlots.map((s) => (
                    <button
                      key={s.time}
                      onClick={() => setTime(s.time)}
                      disabled={!s.available}
                      className={`p-2 text-sm font-sans transition-all border ${
                        !s.available
                          ? "opacity-30 cursor-not-allowed border-gray-200 bg-gray-50"
                          : time === s.time
                          ? "bg-forest border-forest text-cream"
                          : "border-forest/20 text-forest hover:border-gold"
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={handleBack} className="text-forest/70 hover:text-forest px-4 font-sans tracking-widest uppercase text-sm">
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!time}
              className="bg-gold hover:bg-gold-light text-forest px-8 py-3 font-sans tracking-widest uppercase font-medium disabled:opacity-50 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Guest Details ─── */}
      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-2xl font-serif text-forest mb-2">Guest Details</h3>
          <p className="text-forest/70 mb-8 font-sans text-sm">
            All guests must be 18 years or older to book a court.
          </p>
          <div className="space-y-4 font-sans">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold"
            />
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="Room Number (optional)"
              className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold"
            />
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full p-3 border border-forest/20 focus:outline-none focus:border-gold"
            >
              <option value="1">1 Player</option>
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
            </select>
            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-gold flex-shrink-0"
              />
              <span className="text-sm text-forest/80 leading-relaxed">
                I confirm that I am 18 years or older and agree to the{" "}
                <span className="underline">cancellation policy</span> (free cancellation up to 24 hours before; full charge applies within 24 hours).
              </span>
            </label>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={handleBack} className="text-forest/70 hover:text-forest px-4 font-sans tracking-widest uppercase text-sm">
              Back
            </button>
            <button
              disabled={!isStep3Valid}
              onClick={handleNext}
              className="bg-gold hover:bg-gold-light text-forest px-8 py-3 font-sans tracking-widest uppercase font-medium transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Add-ons ─── */}
      {step === 4 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-2xl font-serif text-forest mb-2">Enhance Your Experience</h3>
          <p className="text-sm text-forest/60 font-sans mb-8">
            Optional extras for your session.
          </p>
          <div className="space-y-3">
            {/* Equipment packages */}
            <p className="text-xs font-sans tracking-widest uppercase text-forest/50 pt-2">Equipment</p>
            {[
              {
                active: equipment, toggle: () => setEquipment(!equipment),
                title: "Premium Equipment Rental",
                desc: "Two professional rackets + fresh can of balls.",
                price: equipmentPrice,
              },
              {
                active: professionalEquipment, toggle: () => setProfessionalEquipment(!professionalEquipment),
                title: "Professional Equipment Rental",
                desc: "Pro-grade rackets, premium balls + equipment bag. Top-tier gear for serious players.",
                price: professionalEquipmentPrice,
              },
              {
                active: ballsOnly, toggle: () => setBallsOnly(!ballsOnly),
                title: "Ball Package",
                desc: "Fresh can of tennis balls only. Perfect if you have your own racket.",
                price: ballsOnlyPrice,
              },
            ].map((addon) => (
              <div
                key={addon.title}
                className={`p-5 border cursor-pointer transition-all ${
                  addon.active ? "border-gold bg-gold/5" : "border-forest/20 hover:border-gold/50"
                }`}
                onClick={addon.toggle}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 mt-0.5 flex-shrink-0 border-2 rounded-sm flex items-center justify-center ${addon.active ? "border-gold bg-gold" : "border-forest/30"}`}>
                      {addon.active && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-forest leading-tight">{addon.title}</h4>
                      <p className="text-xs text-forest/60 font-sans mt-0.5">{addon.desc}</p>
                    </div>
                  </div>
                  <span className="font-sans font-medium text-forest flex-shrink-0">+€{addon.price}</span>
                </div>
              </div>
            ))}

            {/* Coaching packages */}
            <p className="text-xs font-sans tracking-widest uppercase text-forest/50 pt-4">Coaching</p>
            {[
              {
                active: coaching, toggle: () => setCoaching(!coaching),
                title: "Private Coaching Session",
                desc: "60-minute one-on-one session with our resident pro coach.",
                price: coachingPrice,
              },
              {
                active: professionalCoaching, toggle: () => setProfessionalCoaching(!professionalCoaching),
                title: "Professional Coaching Session",
                desc: "90-minute intensive session with video analysis, tactical advice and personalised training plan.",
                price: professionalCoachingPrice,
              },
            ].map((addon) => (
              <div
                key={addon.title}
                className={`p-5 border cursor-pointer transition-all ${
                  addon.active ? "border-gold bg-gold/5" : "border-forest/20 hover:border-gold/50"
                }`}
                onClick={addon.toggle}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 mt-0.5 flex-shrink-0 border-2 rounded-sm flex items-center justify-center ${addon.active ? "border-gold bg-gold" : "border-forest/30"}`}>
                      {addon.active && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-forest leading-tight">{addon.title}</h4>
                      <p className="text-xs text-forest/60 font-sans mt-0.5">{addon.desc}</p>
                    </div>
                  </div>
                  <span className="font-sans font-medium text-forest flex-shrink-0">+€{addon.price}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={handleBack} className="text-forest/70 hover:text-forest px-4 font-sans tracking-widest uppercase text-sm">
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-gold hover:bg-gold-light text-forest px-8 py-3 font-sans tracking-widest uppercase font-medium transition-colors"
            >
              Review & Pay
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 5: Summary & Confirm ─── */}
      {step === 5 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-2xl font-serif text-forest mb-6">Summary & Confirm</h3>

          {/* Booking Summary */}
          <div className="bg-cream p-6 mb-6 border border-forest/10 font-sans text-sm space-y-1">
            <div className="flex justify-between text-forest/70 mb-3 font-medium">
              <span>Reservation Details</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Court</span>
              <span className="font-medium text-forest">{selectedCourt?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Date</span>
              <span className="font-medium text-forest">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Time</span>
              <span className="font-medium text-forest">{time} (60 min)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Guest</span>
              <span className="font-medium text-forest">{name}</span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-cream p-6 mb-6 border border-forest/10 font-sans">
            <div className="flex justify-between mb-2">
              <span className="text-forest/70">Court Rental (60 min)</span>
              <span className="text-forest">€{base.toFixed(2)}</span>
            </div>
            {equipment && (
              <div className="flex justify-between mb-2">
                <span className="text-forest/70">Premium Equipment Rental</span>
                <span className="text-forest">€{equipmentPrice.toFixed(2)}</span>
              </div>
            )}
            {professionalEquipment && (
              <div className="flex justify-between mb-2">
                <span className="text-forest/70">Professional Equipment Rental</span>
                <span className="text-forest">€{professionalEquipmentPrice.toFixed(2)}</span>
              </div>
            )}
            {ballsOnly && (
              <div className="flex justify-between mb-2">
                <span className="text-forest/70">Ball Package</span>
                <span className="text-forest">€{ballsOnlyPrice.toFixed(2)}</span>
              </div>
            )}
            {coaching && (
              <div className="flex justify-between mb-2">
                <span className="text-forest/70">Private Coaching Session</span>
                <span className="text-forest">€{coachingPrice.toFixed(2)}</span>
              </div>
            )}
            {professionalCoaching && (
              <div className="flex justify-between mb-2">
                <span className="text-forest/70">Professional Coaching Session</span>
                <span className="text-forest">€{professionalCoachingPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between mb-2 text-sm text-forest/50">
              <span>Service Charge (10%)</span>
              <span>€{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm text-forest/50">
              <span>GST / KDV (9%)</span>
              <span>€{gst.toFixed(2)}</span>
            </div>
            <div className="border-t border-forest/20 my-4" />
            <div className="flex justify-between font-serif text-xl text-forest">
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Cancellation Policy Notice */}
          <div className="mb-6 p-4 border border-amber-200 bg-amber-50 text-amber-800 font-sans text-sm">
            <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before your booking. Cancellations within 24 hours are subject to the full charge.
          </div>

          {/* Info note */}
          <div className="mb-6 p-4 border border-forest/10 bg-forest/5 text-forest/70 font-sans text-sm">
            This is a <strong>reservation request</strong>. Our team will review and confirm your booking. A confirmation will be sent to <strong>{email}</strong>.
          </div>

          {errorString && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-600 font-sans text-sm">
              {errorString}
            </div>
          )}

          <button
            onClick={submitBooking}
            disabled={isSubmitting}
            className="w-full bg-forest text-cream py-4 font-sans tracking-widest uppercase font-medium hover:bg-forest-light transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {isSubmitting ? "Processing..." : "Confirm Reservation Request"}
          </button>
          <div className="mt-4 text-center">
            <button
              disabled={isSubmitting}
              onClick={handleBack}
              className="text-forest/70 hover:text-forest font-sans tracking-widest uppercase text-sm"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 6: Confirmation ─── */}
      {step === 6 && (
        <div className="animate-in fade-in zoom-in duration-500 text-center py-12">
          <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6 text-gold">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-3xl font-serif text-forest mb-4">Request Received</h3>
          <p className="text-forest/70 font-sans max-w-md mx-auto mb-4">
            Your reservation request for <strong>{selectedCourt?.name}</strong> on{" "}
            <strong>{date}</strong> at <strong>{time}</strong> has been submitted.
          </p>
          <p className="text-forest/60 font-sans text-sm max-w-sm mx-auto mb-8">
            A confirmation email has been sent to <strong>{email}</strong>. Our team will review and confirm your booking shortly.
          </p>
          <div className="bg-cream p-4 inline-block border border-forest/10 font-mono text-forest/80 text-sm mb-8">
            Ref: CTC-{bookingRef || "PENDING"}
          </div>
          <p className="text-xs font-sans text-forest/50 max-w-xs mx-auto">
            To cancel your booking, visit the <a href="/cancel" className="underline hover:text-forest">cancellation page</a> with your reference number and email.
          </p>
        </div>
      )}
    </div>
  );
}
