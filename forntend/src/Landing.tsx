import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Phone, AlertTriangle, Clock, MapPin, Star, CheckCircle2, Users, Zap, Shield } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  const portalData = [
    {
      id: 'patient',
      title: 'Patient Portal',
      subtitle: 'For Patients & Families',
      icon: '👨‍👩‍👧‍👦',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-pink-500',
      features: [
        'Book & Manage Appointments',
        'View Medical Records',
        'Online Bill Payment',
        'Prescription Management',
        'Lab Results Access'
      ],
      borderColor: 'border-purple-200',
      accentColor: '#667eea',
      routes: { login: '/patient-login', signup: '/patient-signup' }
    },
    {
      id: 'doctor',
      title: 'Doctor Portal',
      subtitle: 'For Medical Professionals',
      icon: '👨‍⚕️',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-emerald-500',
      features: [
        'Patient Consultation Records',
        'Appointment Schedule',
        'Prescription Management',
        'Treatment History',
        'Lab Results Review'
      ],
      borderColor: 'border-green-200',
      accentColor: '#10b981',
      routes: { login: '/doctor-login', signup: '/doctor-signup' }
    },
    {
      id: 'staff',
      title: 'Staff Portal',
      subtitle: 'For Admin & Support Staff',
      icon: '🏥',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-cyan-500',
      features: [
        'Patient Database Management',
        'Appointment Scheduling',
        'Billing & Insurance',
        'Inventory Management',
        'Reports & Analytics'
      ],
      borderColor: 'border-blue-200',
      accentColor: '#3b82f6',
      routes: { login: '/staff-login' }
    }
  ]

  const branches = [
    {
      name: 'Colombo',
      address: '123 Main Street, Colombo 03',
      phone: '+94111234567',
      hours: 'Mon-Sat: 9 AM - 5 PM'
    },
    {
      name: 'Kandy',
      address: '456 Hill Road, Kandy',
      phone: '+94817654321',
      hours: 'Mon-Sat: 9 AM - 5 PM'
    },
    {
      name: 'Galle',
      address: '789 Beach Road, Galle',
      phone: '+94915551234',
      hours: 'Mon-Sat: 9 AM - 5 PM'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      text: 'MedSync made managing my health incredibly convenient. The appointment booking system is seamless!',
      avatar: '👩‍⚕️',
      rating: 5
    },
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Medical Professional',
      text: 'The doctor portal is intuitive and helps me manage patient records efficiently. Highly recommended!',
      avatar: '👨‍⚕️',
      rating: 5
    },
    {
      name: 'Emma Wilson',
      role: 'Admin Staff',
      text: 'The staff portal streamlined our operations significantly. Great tool for healthcare management.',
      avatar: '👩‍💼',
      rating: 5
    }
  ]

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Private',
      desc: 'Enterprise-grade encryption for all patient data'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      desc: 'Optimized performance for seamless experience'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Multi-User Support',
      desc: 'Role-based access for patients, doctors, and staff'
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'HIPAA Compliant',
      desc: 'Meets all healthcare industry standards'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl font-bold animate-pulse">
              ✚
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MedSync</h1>
              <p className="text-xs text-muted-foreground">Healthcare Management</p>
            </div>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#portals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Portals</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#branches" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Branches</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex gap-3 items-center">
            <a href="tel:+94115430000" className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span className="hidden md:inline">+94 11 543 0000</span>
            </a>
            <Button variant="destructive" size="sm" className="gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">1566</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/20">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="max-w-7xl mx-auto px-4 py-24 relative z-10">
          <div className="text-center space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold">
              ✨ Welcome to MedSync Healthcare
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground">
              Your Health, <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Our Priority</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience world-class healthcare with cutting-edge technology, expert medical professionals, and compassionate care. Your journey to better health starts here.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" className="gap-2 bg-purple-500 hover:bg-purple-600">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { number: '50K+', label: 'Patients Served', color: 'text-purple-500' },
              { number: '200+', label: 'Medical Experts', color: 'text-green-500' },
              { number: '15+', label: 'Years Excellence', color: 'text-amber-500' },
              { number: '24/7', label: 'Emergency Care', color: 'text-destructive' }
            ].map((stat, idx) => (
              <Card key={idx} className="p-6 text-center border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-colors">
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>{stat.number}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose MedSync?</h2>
            <p className="text-lg text-muted-foreground">Advanced features built for modern healthcare</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Selection Section */}
      <section id="portals" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold mb-4">
              SELECT YOUR PORTAL
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">Access Your Dashboard</h2>
            <p className="text-lg text-muted-foreground">Choose the portal that matches your role</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {portalData.map((portal) => (
              <Card
                key={portal.id}
                className={`border-2 ${portal.borderColor} p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden group bg-card/50 backdrop-blur-sm`}
              >
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${portal.gradientFrom} ${portal.gradientTo} opacity-5 rounded-full group-hover:opacity-10 transition-opacity`}></div>

                <div className="relative z-10">
                  <div className={`w-20 h-20 bg-gradient-to-br ${portal.gradientFrom} ${portal.gradientTo} rounded-2xl flex items-center justify-center text-4xl mb-6`}>
                    {portal.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-2">{portal.title}</h3>
                  <p className="text-muted-foreground mb-6">{portal.subtitle}</p>

                  <ul className="space-y-3 mb-8">
                    {portal.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 bg-gradient-to-br ${portal.gradientFrom} ${portal.gradientTo} bg-clip-text text-transparent`} />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {portal.id === 'staff' ? (
                    <Button
                      onClick={() => navigate(portal.routes.login)}
                      className="w-full gap-2 font-semibold"
                      style={{ background: portal.accentColor }}
                    >
                      Staff Login <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => navigate(portal.routes.login)}
                        className="flex-1 font-semibold"
                        style={{ background: portal.accentColor }}
                      >
                        Login
                      </Button>
                      <Button
                        onClick={() => navigate(portal.routes.signup)}
                        variant="outline"
                        className="flex-1 font-semibold"
                      >
                        Register
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground">Trusted by thousands of patients and healthcare professionals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="p-8 hover:shadow-lg transition-all border-0 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{testimonial.text}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section id="branches" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Our Branches</h2>
            <p className="text-lg text-muted-foreground">Serving communities across the country</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {branches.map((branch, idx) => (
              <Card key={idx} className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{branch.name}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{branch.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${branch.phone}`} className="text-sm text-primary hover:underline font-medium">
                      {branch.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">{branch.hours}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6">Get Directions</Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-lg text-muted-foreground">Get in touch with us anytime</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🚨', label: 'Emergency Hotline', number: '+94 11 543 1088' },
              { icon: '📞', label: 'General Line', number: '+94 11 543 0000' },
              { icon: '👨‍⚕️', label: 'Doctor Channeling', number: '+94 70 237 1591' }
            ].map((contact, idx) => (
              <Card key={idx} className="p-8 text-center hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm">
                <div className="text-5xl mb-4">{contact.icon}</div>
                <h4 className="text-lg font-semibold text-foreground mb-2">{contact.label}</h4>
                <a href={`tel:${contact.number.replace(/\s/g, '')}`} className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  {contact.number}
                </a>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Transform Your Healthcare Experience?</h2>
          <p className="text-lg text-muted-foreground mb-8">Join thousands of satisfied patients and healthcare professionals today</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="gap-2 bg-purple-500 hover:bg-purple-600">
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline">Schedule Demo</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                  ✚
                </div>
                <h3 className="text-lg font-bold text-foreground">MedSync</h3>
              </div>
              <p className="text-sm text-muted-foreground">Revolutionizing healthcare management</p>
            </div>
            {[
              { title: 'Quick Links', links: ['Home', 'Portals', 'Features', 'Branches'] },
              { title: 'Services', links: ['Patient Care', 'Doctor Portal', 'Staff Management', 'Billing'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact'] }
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-foreground mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, i) => (
                    <li key={i}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2025 MedSync Medical Center. All rights reserved.</p>
            <div className="flex gap-4">
              {['f', '𝕏', 'in', '📷'].map((social, idx) => (
                <a key={idx} href="#" className="w-10 h-10 rounded-full bg-secondary hover:bg-purple-500 hover:text-white flex items-center justify-center transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Fixed CTA */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <a
          href="tel:+94117145145"
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          <Phone className="w-4 h-4" />
          <div className="text-right text-sm hidden sm:block">
            <div>DOCHELP</div>
            <div>0117 145 145</div>
          </div>
        </a>
        <a
          href="tel:1566"
          className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 animate-pulse"
        >
          <AlertTriangle className="w-4 h-4" />
          <div className="text-right text-sm hidden sm:block">
            <div>Emergency</div>
            <div>1566</div>
          </div>
        </a>
      </div>
    </div>
  )
}