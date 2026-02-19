import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);
  const { clearCart, refreshCart } = useCart();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const response = await axios.get(`${API}/checkout/status/${sessionId}`);
        
        if (response.data.payment_status === 'paid') {
          setStatus('success');
          clearCart();
          refreshCart();
        } else if (response.data.status === 'expired') {
          setStatus('expired');
        } else if (attempts < 5) {
          // Continue polling
          setTimeout(() => setAttempts(a => a + 1), 2000);
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (attempts < 5) {
          setTimeout(() => setAttempts(a => a + 1), 2000);
        } else {
          setStatus('error');
        }
      }
    };

    checkPaymentStatus();
  }, [sessionId, attempts, clearCart, refreshCart]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center" data-testid="success-page-loading">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-muted-foreground">Betaling wordt gecontroleerd...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen pt-20" data-testid="success-page">
        <div className="px-6 lg:px-12 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-serif text-3xl lg:text-4xl mb-4">
                Bedankt voor je bestelling!
              </h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                We hebben je bestelling ontvangen en gaan direct aan de slag. 
                Je ontvangt een bevestiging per e-mail met alle details.
              </p>

              <div className="bg-muted/50 border border-border p-6 mb-8 text-left">
                <div className="flex items-start gap-4">
                  <Package className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium mb-1">Wat nu?</p>
                    <p className="text-sm text-muted-foreground">
                      Je bestelling wordt met zorg verpakt en verzonden. 
                      Bij verzending ontvang je een track & trace code.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/shop" data-testid="continue-shopping-success">
                  <Button className="btn-primary rounded-sm w-full sm:w-auto">
                    Verder winkelen
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/" data-testid="home-link-success">
                  <Button variant="outline" className="btn-secondary rounded-sm w-full sm:w-auto">
                    Terug naar home
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Error or expired states
  return (
    <div className="min-h-screen pt-20" data-testid="success-page-error">
      <div className="px-6 lg:px-12 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-serif text-3xl mb-4">
              {status === 'expired' ? 'Sessie verlopen' : 'Er ging iets mis'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {status === 'expired' 
                ? 'Je betaalsessie is verlopen. Probeer het opnieuw.'
                : status === 'pending'
                ? 'Je betaling wordt nog verwerkt. Controleer je e-mail voor bevestiging.'
                : 'We konden je betaling niet verifiëren. Neem contact op als het probleem aanhoudt.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cart">
                <Button className="btn-primary rounded-sm w-full sm:w-auto">
                  Terug naar winkelwagen
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="btn-secondary rounded-sm w-full sm:w-auto">
                  Contact opnemen
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
