import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { FloatingShapes } from "@/components/global/floating-shapes";
import { ThemeProvider } from "@/components/global/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Fotora",
    description: "A photo editor app",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <main className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
                        <FloatingShapes />
                        {children}
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}
