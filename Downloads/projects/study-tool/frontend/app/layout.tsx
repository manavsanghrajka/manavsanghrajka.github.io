import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import AudioPlayer from "@/components/AudioPlayer";

export const metadata: Metadata = {
  title: "Hyperlapse",
  description: "AI-powered adaptive study planning for exam success",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
          <AudioPlayer />
        </Providers>
      </body>
    </html>
  );
}
