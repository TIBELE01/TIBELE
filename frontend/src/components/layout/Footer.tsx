import { MedicalDisclaimer } from '@/components/medical/MedicalDisclaimer';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 py-6 pl-4 pr-20 sm:pr-4">
        <MedicalDisclaimer variant="compact" />
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} TIBELE — Plateforme gratuite.
        </p>
      </div>
    </footer>
  );
}
