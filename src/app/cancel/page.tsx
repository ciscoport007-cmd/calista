import CancelWidget from "./CancelWidget";
import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="w-full flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="font-serif text-2xl tracking-widest text-forest select-none">
          CALISTA TENNIS COURTS
        </Link>
        <Link href="/" className="text-sm uppercase tracking-widest font-medium hover:text-gold transition-colors">
          Back to Home
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-cream">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif text-forest mb-4">
            Manage Your Booking
          </h1>
          <div className="w-16 h-0.5 bg-gold mx-auto mb-4" />
          <p className="font-sans text-forest/70 max-w-md mx-auto text-sm">
            Enter your booking reference and email address to look up or cancel your reservation.
          </p>
        </div>
        <CancelWidget />
      </main>

      <footer className="w-full bg-forest text-cream py-12 text-center text-sm font-sans tracking-widest">
        <p>&copy; {new Date().getFullYear()} CALISTA TENNIS COURTS. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
