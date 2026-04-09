import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div>
          <h1 className="text-4xl font-bold text-primary-700">HST-R</h1>
          <p className="mt-2 text-lg text-gray-600">
            Hastane Randevu ve Sıra Takip Sistemi
          </p>
        </div>

        {/* Hasta Girişi */}
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-primary-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-primary-700"
          >
            Hasta Girişi
          </Link>

          <Link
            href="/login?role=staff"
            className="block w-full rounded-xl border-2 border-primary-600 px-6 py-4 text-lg font-semibold text-primary-600 transition hover:bg-primary-50"
          >
            Personel Girişi
          </Link>
        </div>

        {/* Hastane Kaydı */}
        <div className="pt-4">
          <Link
            href="/register"
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Hastanenizi kaydetmek için tıklayın
          </Link>
        </div>
      </div>
    </div>
  );
}
