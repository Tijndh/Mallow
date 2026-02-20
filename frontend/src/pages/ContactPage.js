import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await axios.post(`${API}/contact`, formData);
      toast.success('Bericht verzonden!', {
        description: 'We nemen zo snel mogelijk contact met je op.'
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Er ging iets mis', {
        description: 'Probeer het later opnieuw.'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-20" data-testid="contact-page">
      {/* Header */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
              Contact
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl mb-6">
              Neem contact<br />
              <span className="italic">met ons op</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Heb je een vraag over onze producten of wil je meer weten 
              over Mallow? We horen graag van je.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-24">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-8"
            >
              <div>
                <h2 className="font-serif text-2xl mb-6">Contactgegevens</h2>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                      <a 
                        href="mailto:info@mallow.nl" 
                        className="text-foreground hover:opacity-70 transition-opacity"
                      >
                        info@mallow.nl
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Telefoon</p>
                      <a 
                        href="tel:+31612345678" 
                        className="text-foreground hover:opacity-70 transition-opacity"
                      >
                        +31 6 12345678
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Locatie</p>
                      <p className="text-foreground">
                        Betuwe, Nederland
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-8 border-t border-border">
                <h3 className="font-serif text-lg mb-4">Openingstijden</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Maandag - Vrijdag</span>
                    <span>9:00 - 17:00</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Zaterdag</span>
                    <span>Op afspraak</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Zondag</span>
                    <span>Gesloten</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3"
            >
              <div className="bg-card border border-border p-8 lg:p-12">
                <h2 className="font-serif text-2xl mb-8">Stuur een bericht</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Naam</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input-underline"
                        placeholder="Je naam"
                        data-testid="contact-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="input-underline"
                        placeholder="je@email.nl"
                        data-testid="contact-email-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Onderwerp</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="input-underline"
                      placeholder="Waar gaat je bericht over?"
                      data-testid="contact-subject-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Bericht</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="resize-none bg-transparent border border-input rounded-sm focus:border-primary focus:ring-0 px-4 py-4"
                      placeholder="Schrijf hier je bericht..."
                      data-testid="contact-message-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={sending}
                    className="btn-primary rounded-sm w-full md:w-auto"
                    data-testid="contact-submit-button"
                  >
                    {sending ? 'Verzenden...' : 'Verstuur bericht'}
                    <Send className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
