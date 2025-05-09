import { useState, useEffect } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements, 
  CardElement 
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PaymentFormProps {
  onPaymentComplete: (success: boolean) => void;
  clientSecret: string | null;
}

export function PaymentForm({ onPaymentComplete, clientSecret }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/tenants',
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred with your payment');
        onPaymentComplete(false);
      } else {
        // Payment succeeded
        onPaymentComplete(true);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred');
      onPaymentComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Show card element when clientSecret is not available yet */}
      {!clientSecret ? (
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      ) : (
        <PaymentElement />
      )}

      {errorMessage && (
        <div className="text-sm text-destructive">{errorMessage}</div>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Confirm Payment'
        )}
      </Button>
    </form>
  );
}