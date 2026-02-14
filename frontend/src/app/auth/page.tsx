import { AuthForm } from '@/components/AuthForm';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-xl font-bold tracking-tight">Subtext</Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <AuthForm />
      </div>
    </div>
  );
}
