import ScannerView from "./ScannerView";

export const metadata = { title: "Escanear · NaturalPack" };
export const dynamic = "force-dynamic";

export default function ScanPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? null;
  return <ScannerView key={token ?? "camera"} initialToken={token} />;
}
