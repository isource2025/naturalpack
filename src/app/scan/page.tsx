import ScannerView from "./ScannerView";

export const metadata = { title: "Escanear · NaturalPack" };
export const dynamic = "force-dynamic";

export default function ScanPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return <ScannerView initialToken={searchParams.token ?? null} />;
}
