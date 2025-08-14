import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { neobrutalism } from "@clerk/themes";

import { FloatingShapes } from "@/components/global/floating-shapes";
import { ThemeProvider } from "@/components/global/theme-provider";
import Header from "@/components/global/header";
import { ConvexClientProvider } from "./ConvexClientProvider";

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
                    <ClerkProvider
                        publishableKey={
                            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
                        }
                        appearance={{
                            baseTheme: neobrutalism,
                        }}
                    >
                        <ConvexClientProvider>
                            <Header />
                            <main className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
                                <FloatingShapes />
                                {children}
                            </main>
                        </ConvexClientProvider>
                    </ClerkProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
