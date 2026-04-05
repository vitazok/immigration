import { SignIn } from '@clerk/nextjs';
import { setRequestLocale } from 'next-intl/server';

export default function SignInPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="flex justify-center items-center min-h-[60vh] px-6">
      <SignIn />
    </div>
  );
}
