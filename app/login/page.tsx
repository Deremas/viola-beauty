import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { login } from "./actions";
import { BrandMark } from "@/components/public/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export const metadata = pageMetadata({
  title: "Staff Login",
  description: "Staff sign-in for Viola Brows and Beauty.",
  path: "/login",
  index: false,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retryAfter?: string }>;
}) {
  const query = await searchParams;
  const retryMinutes = Math.max(1, Math.ceil((Number(query.retryAfter) || 60) / 60));
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4E4EE] px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" aria-label="Viola Brows and Beauty home" className="mb-8 flex justify-center">
          <BrandMark />
        </Link>
        <Card className="border-brand-line bg-white">
          <CardHeader className="space-y-3 px-6 pt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Staff</p>
            <CardTitle className="font-display text-4xl font-semibold text-brand-plum">Sign in</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">Use your Viola staff username and password to open the studio desk.</p>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            {query.error ? (
              <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive" role="alert">
                {query.error === "rate"
                  ? `Too many sign-in attempts. Please wait ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"} and try again.`
                  : "The username or password is incorrect."}
              </div>
            ) : null}
            <form action={login} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" autoComplete="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" name="password" autoComplete="current-password" required />
              </div>
              <Button type="submit" className="h-11 w-full" pendingText="Signing in...">Sign in</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
