import { SignUp } from '@clerk/nextjs';
import { setRequestLocale } from 'next-intl/server';

export default function SignUpPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="flex justify-center items-center min-h-[60vh] px-6">
      <SignUp />
    </div>
  );
}
