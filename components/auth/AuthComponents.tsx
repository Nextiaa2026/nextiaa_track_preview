"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import { Logo } from "@/components/logo";

export const AuthLogo = () => (
  <div className="flex justify-center mb-6">
    <Logo showText={true} className="pointer-events-none" />
  </div>
);

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const currentLocale = pathname.split("/")[1] || "fr";

  const handleLanguageChange = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className={className || "fixed top-6 right-6 z-50"}>
      <Select value={currentLocale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[110px] h-9 text-xs bg-white border-gray-200 rounded-full">
          <Languages className="size-3.5 mr-2 text-gray-500" />
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          <SelectItem value="en" className="rounded-xl">English</SelectItem>
          <SelectItem value="fr" className="rounded-xl">Français</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50/80 p-4 animate-in fade-in duration-500 relative">
      <LanguageSwitcher />
      <div className="w-full max-w-md">
        <AuthLogo />
        <div className="bg-white rounded-[24px] border border-gray-200 p-10 shadow-xl shadow-black/5">
          {children}
        </div>
        <p className="text-center text-[10px] text-gray-400 tracking-wide mt-6">
          &copy; 2026 2NP · Tous droits réservés
        </p>
      </div>
    </div>
  );
}
