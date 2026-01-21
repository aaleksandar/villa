"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { AuthModal } from "@/components/auth";
import { useIdentityStore } from "@/lib/store";
import { createAvatarConfig } from "@/lib/avatar";
import { isPortoSupported } from "@/lib/porto";
import {
  detectInAppBrowser,
  getAppDisplayName,
  getCurrentUrl,
  type InAppBrowserInfo,
} from "@/lib/browser";
import {
  authenticateTinyCloud,
  syncToTinyCloud,
} from "@/lib/storage/tinycloud-client";

type Step = "inapp-browser" | "welcome" | "error";

interface ErrorState {
  message: string;
  retry: () => void;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream-50">
      <div className="w-full max-w-md text-center">
        <Spinner size="lg" />
      </div>
    </main>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { identity, setIdentity } = useIdentityStore();

  const [step, setStep] = useState<Step>("welcome");
  const [error, setError] = useState<ErrorState | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [inAppBrowser, setInAppBrowser] = useState<InAppBrowserInfo | null>(
    null,
  );
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const browserInfo = detectInAppBrowser();
    if (browserInfo.isInApp) {
      setInAppBrowser(browserInfo);
      setStep("inapp-browser");
      return;
    }

    if (!isPortoSupported()) {
      setIsSupported(false);
      setError({
        message:
          "Your browser does not support passkeys. Please use a modern browser like Safari, Chrome, or Edge.",
        retry: () => {
          window.location.reload();
        },
      });
      setStep("error");
    }
  }, []);

  useEffect(() => {
    if (identity) {
      router.replace("/home");
    }
  }, [identity, router]);

  const handleAuthSuccess = async (address: string) => {
    let nickname = formatAddressAsName(address);
    try {
      const response = await fetch(`/api/nicknames/reverse/${address}`);
      if (response.ok) {
        const data = await response.json();
        if (data.nickname) {
          nickname = data.nickname;
        }
      }
    } catch {
      /* empty - use address-based name */
    }

    const defaultAvatar = createAvatarConfig("other", 0);

    setIdentity({
      address,
      displayName: nickname,
      avatar: defaultAvatar,
      createdAt: Date.now(),
    });

    saveProfile(address, nickname, defaultAvatar);
    authenticateTinyCloud(address)
      .then(() => syncToTinyCloud())
      .catch(console.warn);

    router.replace("/home");
  };

  const saveProfile = async (
    address: string,
    nickname: string,
    avatar: { style: string; selection?: string; variant?: number },
  ) => {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          nickname,
          avatar: {
            style: avatar.style,
            selection: avatar.selection,
            variant: avatar.variant,
          },
        }),
      });
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const formatAddressAsName = (addr: string): string => {
    if (!addr || addr.length < 10) return "User";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isSupported) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50">
        <div className="w-full max-w-sm">
          {error && <ErrorStep message={error.message} onRetry={error.retry} />}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream-50">
      <div className="w-full max-w-md">
        {step === "inapp-browser" && inAppBrowser && (
          <InAppBrowserStep browserInfo={inAppBrowser} />
        )}

        {step === "welcome" && (
          <WelcomeStep onGetStarted={() => setShowAuthModal(true)} />
        )}

        {step === "error" && error && (
          <ErrorStep message={error.message} onRetry={error.retry} />
        )}
      </div>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
        onCancel={() => setShowAuthModal(false)}
      />
    </main>
  );
}

function InAppBrowserStep({ browserInfo }: { browserInfo: InAppBrowserInfo }) {
  const [copied, setCopied] = useState(false);
  const appName = getAppDisplayName(browserInfo.app);
  const url = getCurrentUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-accent-yellow rounded-2xl flex items-center justify-center">
          <ExternalLink className="w-8 h-8 text-accent-brown" />
        </div>
        <h1 className="text-2xl font-serif tracking-tight text-ink">
          Open in Browser
        </h1>
        <p className="text-ink-muted">
          For security, passkeys only work in{" "}
          <span className="font-medium text-ink">Safari</span> or{" "}
          <span className="font-medium text-ink">Chrome</span>.
        </p>
      </div>

      <div className="bg-cream-100 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-ink">You&apos;re in {appName}</p>
        <p className="text-sm text-ink-muted">{browserInfo.instructions}</p>
      </div>

      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={handleCopy}>
          {copied ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 mr-2" />
              Copy Link
            </>
          )}
        </Button>
        <p className="text-xs text-ink-muted">Then paste in Safari or Chrome</p>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <p className="text-xs text-ink-muted">
          Why? In-app browsers can&apos;t securely store passkeys. Opening in a
          real browser keeps your identity safe.
        </p>
      </div>
    </div>
  );
}

function WelcomeStep({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent-yellow to-villa-500 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-4xl font-serif text-accent-brown">V</span>
        </div>
        <h1 className="text-3xl font-serif tracking-tight text-ink">
          Welcome to Villa
        </h1>
        <p className="text-ink-muted max-w-xs mx-auto">
          Your identity. No passwords. Just you.
        </p>
      </div>

      <div className="space-y-4">
        <Button size="lg" className="w-full" onClick={onGetStarted}>
          Get Started
        </Button>
        <p className="text-xs text-ink-muted">
          Sign in with your fingerprint, face, or security key
        </p>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <p className="text-xs text-ink-muted">
          Works with 1Password, iCloud Keychain, Google Password Manager, and
          hardware keys
        </p>
      </div>
    </div>
  );
}

function ErrorStep({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-serif text-ink">Something went wrong</h2>
        <p className="text-ink-muted">{message}</p>
      </div>
      <Button size="lg" className="w-full" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}
