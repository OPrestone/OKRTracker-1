import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeElementsWrapperProps {
  clientSecret: string | null;
  children: React.ReactNode;
}

export function StripeElementsWrapper({ clientSecret, children }: StripeElementsWrapperProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify Stripe is loaded
    if (stripePromise) {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a client secret, provide it to Elements
  // Otherwise just initialize Elements without a client secret
  const options = clientSecret 
    ? { clientSecret }
    : {};

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}