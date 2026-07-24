import { PaymentStatus, type Prisma } from "@prisma/client";
import { appDateRange } from "@/lib/timezone";

export type PaymentFilterValues = {
  status: string;
  bankAccountId: string;
  serviceId: string;
  client: string;
  phone: string;
  dateFrom: string;
  dateTo: string;
};

export function paymentFiltersFromRecord(params: Record<string, string | string[] | undefined>): PaymentFilterValues {
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  return {
    status: value("status"),
    bankAccountId: value("bankAccountId"),
    serviceId: value("serviceId"),
    client: value("client"),
    phone: value("phone"),
    dateFrom: value("dateFrom"),
    dateTo: value("dateTo"),
  };
}

export function paymentFiltersFromUrl(searchParams: URLSearchParams): PaymentFilterValues {
  return {
    status: searchParams.get("status") || "",
    bankAccountId: searchParams.get("bankAccountId") || "",
    serviceId: searchParams.get("serviceId") || "",
    client: searchParams.get("client") || "",
    phone: searchParams.get("phone") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  };
}

export function buildPaymentWhere(filters: PaymentFilterValues): Prisma.PaymentWhereInput {
  const validStatus = Object.values(PaymentStatus).includes(filters.status as PaymentStatus)
    ? filters.status as PaymentStatus
    : undefined;

  return {
    paymentStatus: validStatus,
    bankAccountId: filters.bankAccountId || undefined,
    booking: {
      serviceId: filters.serviceId || undefined,
      startDateTime: filters.dateFrom || filters.dateTo
        ? {
            gte: filters.dateFrom ? appDateRange(filters.dateFrom).start : undefined,
            lt: filters.dateTo ? appDateRange(filters.dateTo).end : undefined,
          }
        : undefined,
      client: {
        fullName: filters.client ? { contains: filters.client, mode: "insensitive" } : undefined,
        phone: filters.phone ? { contains: filters.phone } : undefined,
      },
    },
  };
}
