import dynamic from "next/dynamic";

// SynthwaveTrackコンポーネントを動的にインポート（クライアントサイドのみ）
const DynamicSynthwaveTrack = dynamic(
  () => import("@/components/SynthwaveTrack"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Synthwave Drum Machine</h1>
      <DynamicSynthwaveTrack />
    </main>
  );
}
