import type { Metadata } from "next";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ExportReconciliationView, ESR_APP_NAME } from "@/components/public/legal-pages";
import { buildSeoMetadataByPageKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadataByPageKey({
    locale: "en",
    path: "/export-sales-reconciliation",
    pageKey: "export-sales-reconciliation",
    fallbackTitle: `${ESR_APP_NAME} | Taxs`,
    fallbackDescription:
      "Reconcile cross-border e-commerce exports with actual marketplace sales: read-only sync of orders, settlements and inbound shipments, SKU to customs mapping, and reconciliation reports per declaration line.",
  });
}

export default async function EnExportSalesReconciliationPage() {
  return (
    <PublicChrome locale="en">
      <ExportReconciliationView />
    </PublicChrome>
  );
}
