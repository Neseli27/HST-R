import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-5xl font-bold text-primary-700">HST-R</h1>
          <p className="mt-3 text-lg text-gray-600">
            Hastane Randevu ve Sıra Takip Sistemi
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-primary-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-primary-700"
          >
            Giriş Yap
          </Link>
        </div>

        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
          Demo modu aktif — Firebase Auth devre dışı, test kullanıcılarla giriş yapabilirsiniz
        </p>
      </div>
    </div>
  );
}
