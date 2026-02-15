'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function CheckoutRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect old checkout URLs to the new payment page
    const product = searchParams.get('product') || 'pro_features';
    const conversationId = searchParams.get('conversation_id');
    if (conversationId) {
      router.replace(`/payment?product=${product}&conversation_id=${conversationId}`);
    } else {
      router.replace('/offerings');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full" />
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
      <CheckoutRedirect />
    </Suspense>
  );
}
