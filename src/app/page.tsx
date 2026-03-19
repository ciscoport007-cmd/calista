import Link from "next/link";
import { CalendarDays } from "lucide-react";
import BookingWidget from "@/components/BookingWidget";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Luxury Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="font-serif text-2xl tracking-widest text-forest select-none">CALISTA TENNIS COURTS</div>
        <div className="space-x-8 text-sm uppercase tracking-widest font-medium">
          <Link href="#booking" className="hover:text-gold transition-colors">Book Court</Link>
          <Link href="/cancel" className="hover:text-gold transition-colors">My Booking</Link>
          <Link href="/admin" className="hover:text-gold transition-colors">Admin</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero Section */}
        <section 
          className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center bg-forest bg-cover bg-center overflow-hidden text-cream"
          style={{ backgroundImage: "url('https://calista.com.tr/media/c2sl3pug/calista-resort-hotel-blog-tenis-banner.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl mb-6">Elevate Your Game.</h1>
            <p className="font-sans text-lg md:text-xl text-cream/80 max-w-2xl mx-auto mb-10 font-light">
              Experience world-class amenities and unrivaled service at our signature tennis courts.
            </p>
            <Link 
              href="#booking" 
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-forest px-8 py-4 font-sans font-medium uppercase tracking-widest transition-all duration-300"
            >
              <CalendarDays className="w-5 h-5" />
              Reserve Now
            </Link>
          </div>
        </section>
        
        {/* Booking Section */}
        <section id="booking" className="w-full bg-cream mx-auto py-24 px-4 border-t border-forest/10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl mb-4 text-forest font-serif">Reserve Your Court</h2>
            <div className="w-16 h-0.5 bg-gold mx-auto" />
          </div>
          <BookingWidget />
        </section>
      </main>

      <footer className="w-full bg-forest text-cream py-12 text-center text-sm font-sans tracking-widest">
        <p>&copy; {new Date().getFullYear()} CALISTA TENNIS COURTS. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
