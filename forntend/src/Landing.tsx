import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
// import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from "@/components/ui/button";
import { InfiniteMovingCards } from "./components/ui/infinite-moving-cards";
import {
  ArrowRight,
  Phone,
  AlertTriangle,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  Users,
  Zap,
  Shield,
} from "lucide-react";
import { FocusCards } from "./components/ui/focus-cards";
import { FlipWords } from "./components/ui/flip-words";
import "@/index.css";
import { staffMembers } from "@/data/staff";
import { branches } from "@/data/branches.tsx";
import { BranchesMap } from "@/components/branches-map";
import { Mail } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("#home");

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "portals", "highlights", "staff", "visit-us"];
      const scrollPosition = window.scrollY + 100; // offset for header

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(`#${section}`);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Call once on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to center of section
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(hash.substring(1));
    if (element) {
      const headerOffset = 80; // adjust based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const contacts = [
    {
      icon: Phone,
      label: "Phone",
      value: "+94 11 543 0000",
      action: "Call Now",
      colorClass: "border-chart-1",
      backgroundClass: "bg-chart-1/80",
    },
    {
      icon: Mail,
      label: "Email",
      value: "info@medsync.lk",
      action: "Send Message",
      colorClass: "border-chart-2",
      backgroundClass: "bg-chart-2/80",
    },
    {
      icon: Clock,
      label: "Hours",
      value: "Mon - Sat: 9 AM - 5 PM",
      action: "Schedule",
      colorClass: "border-chart-3",
      backgroundClass: "bg-chart-3/80",
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Multiple Cities",
      action: "Explore",
      colorClass: "border-chart-4",
      backgroundClass: "bg-chart-4/80",
    },
  ];

  const galleryItems = [
    {
      quote: "Modern Medical Facility",
      name: "State-of-the-Art",
      title: "Equipment & Infrastructure",
      image: "/assets/images/photo_1.jpg",
    },
    {
      quote: "Expert Medical Team",
      name: "Experienced",
      title: "Healthcare Professionals",
      image: "/assets/images/photo_2.jpg",
    },
    {
      quote: "Patient Care Excellence",
      name: "Compassionate",
      title: "Medical Services",
      image: "/assets/images/photo_3.jpg",
    },
    {
      quote: "Advanced Technology",
      name: "Cutting-Edge",
      title: "Diagnostic Center",
      image: "/assets/images/photo_4.jpg",
    },
    {
      quote: "Comfortable Facilities",
      name: "Welcoming",
      title: "Patient Wards",
      image: "/assets/images/photo_5.jpg",
    },
  ];

  const navItems = [
    { label: "Home", hash: "#home" },
    { label: "Portals", hash: "#portals" },
    { label: "Highlights", hash: "#highlights" },
    { label: "Staff", hash: "#staff" },
    { label: "Visit Us", hash: "#visit-us" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-15 h-15 flex items-center justify-center">
              <img
                src="/assets/logo.jpg"
                alt="MedSync"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MedSync</h1>
              <p className="text-xs text-muted-foreground">
                Healthcare Management
              </p>
            </div>
          </div>
          <div className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <a
                key={item.hash}
                href={item.hash}
                onClick={(e) => handleNavClick(e, item.hash)}
                className={`text-lg font-medium transition-colors ${
                  activeSection === item.hash
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">1344</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="w-full py-16 bg-gradient-to-b from-background via-background to-secondary/20"
      >
        <div className="items-center justify-center overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left - Hero Image */}
              <div className="relative h-[600px] md:h-[600px] flex items-center justify-center order-2 md:order-1">
                <div className="relative w-full h-full">
                  <img
                    src="/assets/hero.jpeg"
                    alt="Healthcare Hero"
                    className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  />
                  {/* Optional overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                </div>
              </div>

              {/* Right - Text Content */}
              <div className="relative z-10 px-4 w-full order-1 md:order-2">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                      <FlipWords
                        words={[
                          "Your Health,",
                          "Your Wellness,",
                          "Your Future,",
                        ]}
                        duration={2500}
                        className="text-foreground"
                      />
                      <span className="block bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent mt-2">
                        Our Priority
                      </span>
                    </h2>
                  </div>

                  <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                    Experience world-class healthcare with cutting-edge
                    technology, expert medical professionals, and compassionate
                    care. Your journey to better health starts here.
                  </p>

                  <div className="flex gap-4 pt-6 flex-wrap">
                    <Button
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold"
                    >
                      Get Started <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold"
                    >
                      Learn More
                    </Button>
                  </div>

                  {/* Optional: Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
                    <div>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">
                        10K+
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Happy Patients
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">
                        50+
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expert Doctors
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">
                        24/7
                      </p>
                      <p className="text-sm text-muted-foreground">Support</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Selection Section */}
      <section id="portals" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Gateway
            </h2>
            <p className="text-lg text-muted-foreground">
              Access the portal designed for your role
            </p>
          </div>

          {/* Portal Cards Data */}
          {(() => {
            const portalCards = [
              {
                id: "patient",
                title: "Patient Portal",
                description:
                  "Book appointments, manage health records, and access prescriptions",
                src: "/assets/patient.jpeg",
              },
              {
                id: "doctor",
                title: "Doctor Portal",
                description:
                  "Manage patient consultations, prescriptions, and medical records",
                src: "/assets/doctor.jpeg",
              },
              {
                id: "employee",
                title: "Employee Portal",
                description:
                  "Handle appointments, billing, inventory, and analytics",
                src: "/assets/employee.jpeg",
              },
            ];

            const handlePortalClick = (portalId: string) => {
              if (portalId === "patient") {
                navigate("/patient-login");
              } else if (portalId === "doctor") {
                navigate("/doctor-login");
              } else if (portalId === "employee") {
                navigate("/employee-login");
              }
            };

            return (
              <FocusCards cards={portalCards} onCardClick={handlePortalClick} />
            );
          })()}
        </div>
      </section>

      {/* Highlights Section - INFINITE MOVING CARDS */}
      <section id="highlights" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              State-of-the-Art Healthcare
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore our world-class medical facilities and compassionate care
              environment
            </p>
          </div>

          <InfiniteMovingCards
            items={galleryItems}
            direction="left"
            speed="fast"
            pauseOnHover={true}
            className="py-8"
          />
        </div>
      </section>

      {/* Staff Section */}
      <section id="staff" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text">
              Trusted by Healthcare Heroes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Meet the dedicated professionals powering MedSync
            </p>
          </div>

          {/* Infinite Moving Cards */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <InfiniteMovingCards
              items={staffMembers}
              direction="right"
              speed="normal"
              className="py-8"
            />
          </div>
        </div>
      </section>

      {/* Visit Us Section */}
      <section id="visit-us" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Locations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Visit any of our healthcare facilities across the country
            </p>
          </div>

          {/* Map + Contact Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left - Google Maps */}
            <div className="h-[400px] lg:h-[450px] rounded-2xl overflow-hidden shadow-2xl sticky top-20 border border-border/20">
              <BranchesMap branches={branches} />
            </div>

            {/* Right - Contact Section */}
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                {contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className={`group p-6 rounded-xl bg-white dark:bg-slate-900 border ${contact.backgroundClass} border-border/40 hover:border-border/80 hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 ${contact.backgroundClass}`}
                      >
                        <contact.icon className="w-7 h-7" />
                      </div>

                      <div className="flex-1 w-full">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                          {contact.label}
                        </p>
                        <p className="text-sm font-semibold text-foreground mb-4 line-clamp-2">
                          {contact.value}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`w-full text-xs font-semibold hover:shadow-lg border-2 ${contact.colorClass}`}
                          onClick={() => {
                            if (contact.label === "Phone") {
                              window.location.href = `tel:${contact.value.replace(
                                /\s/g,
                                ""
                              )}`;
                            } else if (contact.label === "Email") {
                              window.location.href = `mailto:${contact.value}`;
                            }
                          }}
                        >
                          {contact.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Footer Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img
                    src="/assets/logo.jpg"
                    alt="MedSync"
                    className="w-full h-full object-contain rounded-md"
                  />
                </div>
                <h3 className="text-lg font-bold text-foreground">MedSync</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Revolutionizing healthcare management with technology and
                compassion.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {["Home", "Portals", "Highlights", "Staff", "Visit Us"].map(
                  (link, i) => (
                    <li key={i}>
                      <a
                        href={`#${link.toLowerCase()}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Services</h4>
              <ul className="space-y-2">
                {[
                  "Patient Care",
                  "Doctor Portal",
                  "Staff Management",
                  "Billing",
                ].map((link, i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2">
                {[
                  "Privacy Policy",
                  "Terms of Service",
                  "Cookie Policy",
                  "Contact",
                ].map((link, i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 MedSync Healthcare. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: "𝕏", label: "Twitter" },
                { icon: "f", label: "Facebook" },
                { icon: "in", label: "LinkedIn" },
                { icon: "📷", label: "Instagram" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href="#"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-blue-500 text-foreground hover:text-white flex items-center justify-center transition-all duration-300 font-semibold text-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
