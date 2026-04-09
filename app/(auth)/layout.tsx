import AuthShowcase from "@/components/auth/AuthShowcase";

export default function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-y-auto bg-[#040816]">
      <div className="relative isolate min-h-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,0.95),_rgba(4,8,22,1))]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
          <AuthShowcase />

          <div className="flex min-h-full items-center justify-center lg:justify-end">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
