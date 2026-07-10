import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const booking = await prisma.booking.findUnique({ where: { bookingCode: code } });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Booking request submitted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your appointment is not confirmed yet. Viola Brows and Beauty will confirm your booking after checking your payment.</p>
          <div className="rounded-md border bg-muted p-4 text-lg font-semibold">{booking?.bookingCode || code}</div>
        </CardContent>
      </Card>
    </main>
  );
}
