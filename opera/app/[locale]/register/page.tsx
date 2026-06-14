"use client";

import React, { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Auth");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateInputs = (): boolean => {
    setValidationError("");
    setAuthError("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setValidationError(t("errors.nameRequired"));
      return false;
    }

    if (!email) {
      setValidationError(t("errors.emailRequired"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError(t("errors.emailInvalid"));
      return false;
    }

    if (!password) {
      setValidationError(t("errors.passwordRequired"));
      return false;
    }
    if (password.length < 8) {
      setValidationError(t("errors.passwordLength"));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setAuthError("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
      } else if (data?.user?.identities && data.user.identities.length === 0) {
        setAuthError(t("errors.alreadyExists"));
      } else {
        const isSessionActive = data.session !== null;
        if (isSessionActive) {
          router.push("/home");
          router.refresh();
        } else {
          setSuccessMessage(t("successCreated"));
        }
      }
    } catch (err: unknown) {
      setAuthError(t("errors.unexpected"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setAuthError(t("errors.googleFailed"));
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center">
        <Link
          href="/"
          className="text-sm font-medium tracking-normal text-[#141413] hover:text-[#cc785c] transition-colors font-sans"
        >
          OPERA
        </Link>
      </div>

      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-110">
        <div className="bg-[#efe9de] py-8 px-6 shadow-sm rounded-lg border border-[#e6dfd8] sm:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-[#141413] font-serif">
              {t("registerWelcome")}
            </h2>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 h-10 border border-[#e6dfd8] rounded-md bg-[#faf9f5] text-sm font-medium text-[#141413] hover:bg-[#efe9de] focus:outline-none focus:ring-2 focus:ring-[#cc785c] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer font-sans"
            >
              <SiGoogle className="h-4 w-4 text-[#4285F4]" />
              <span>{t("google")}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-[#e6dfd8]" />
              </div>
              <div className="relative bg-[#efe9de] px-4 text-xs font-medium text-[#6c6a64] uppercase tracking-[1.5px] font-sans">
                {t("or")}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6c6a64] uppercase tracking-[1.5px] font-sans">
                  {t("fullName")}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("fullNamePlaceholder")}
                  disabled={isLoading}
                  className="w-full bg-[#faf9f5] text-[#141413] text-base leading-[1.55] px-3.5 py-2.5 h-10 border border-[#e6dfd8] rounded-md focus:border-[#cc785c] focus:outline-none focus:ring-3 focus:ring-[rgba(204,120,92,0.12)] transition-all disabled:opacity-50 md:text-sm font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6c6a64] uppercase tracking-[1.5px] font-sans">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  disabled={isLoading}
                  className="w-full bg-[#faf9f5] text-[#141413] text-base leading-[1.55] px-3.5 py-2.5 h-10 border border-[#e6dfd8] rounded-md focus:border-[#cc785c] focus:outline-none focus:ring-3 focus:ring-[rgba(204,120,92,0.12)] transition-all disabled:opacity-50 md:text-sm font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6c6a64] uppercase tracking-[1.5px] font-sans">
                  {t("password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full bg-[#faf9f5] text-[#141413] text-base leading-[1.55] pl-3.5 pr-10 py-2.5 h-10 border border-[#e6dfd8] rounded-md focus:border-[#cc785c] focus:outline-none focus:ring-3 focus:ring-[rgba(204,120,92,0.12)] transition-all disabled:opacity-50 md:text-sm font-sans"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6c6a64] hover:text-[#141413] focus:outline-none transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {(validationError || authError) && (
              <div className="text-xs font-medium text-[#c64545] border-l-2 border-[#c64545] pl-3 py-1 bg-[rgba(198,69,69,0.05)] rounded-r font-sans">
                {validationError || authError}
              </div>
            )}

            {successMessage && (
              <div className="text-xs font-medium text-[#5db872] border-l-2 border-[#5db872] pl-3 py-1 bg-[rgba(93,184,114,0.05)] rounded-r font-sans">
                {successMessage}
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-8 py-3.5 h-12 bg-[#cc785c] text-white hover:bg-[#a9583e] font-medium text-sm rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#cc785c] focus:ring-offset-2 disabled:bg-[#e6dfd8] disabled:text-[#6c6a64] disabled:cursor-not-allowed cursor-pointer font-sans"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 text-current" />
              ) : (
                t("register")
              )}
            </button>

            <div className="text-center text-sm text-[#3d3d3a] font-sans">
              {t("alreadyAccount")}{" "}
              <Link
                href="/login"
                className="font-semibold text-[#cc785c] hover:text-[#a9583e] transition-colors"
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
