'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentFlow } from '@/components/PaymentFlow';
import { api } from '@/lib/api';

const PRODUCTS: Record<string, { name: string; description: string; price: string }> = {
  mri: {
    name: 'Relationship MRI',
    description: 'Comprehensive 30-page forensic analysis with multi-agent AI council. Includes Gottman scorecard, attachment mapping, communication audit, and action guide.',
    price: '$49',
  },
  tactical_scan_pro: {
    name: 'Tactical Scan Pro',
    description: 'Enhanced quick analysis with deeper pattern recognition and more detailed insights.',
    price: '$9',
  },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productType = searchParams.get('product') || 'mri';
  const caseId = searchParams.get('case_id');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.getMe();
        setIsAuthenticated(true);
      } catch {
        router.push(`/auth?redirect=/checkout?product=${productType}${caseId ? `&case_id=${caseId}` : ''}`);
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router, productType, caseId]);

  const product = PRODUCTS[productType];

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleSuccess = (paymentIntentId: string) => {
    if (caseId) {
      router.push(`/payment/success?case_id=${caseId}&payment_id=${paymentIntentId}`);
    } else {
      router.push(`/payment/success?payment_id=${paymentIntentId}&product=${productType}`);
    }
  };

  const handleCancel = () => {
    router.push('/scan');
  };

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b">
        <Link href="/" className="text-xl font-bold tracking-tight">Subtext</Link>
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h1>
          {product && (
            <p className="text-gray-500 text-sm">{product.description}</p>
          )}
        </div>

        <PaymentFlow
          productType={productType}
          caseId={caseId || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        <div className="border-t pt-6">
          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>100% money-back guarantee within 24 hours if our analysis cannot be completed.</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your conversation data is encrypted end-to-end. We never see your raw messages.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
