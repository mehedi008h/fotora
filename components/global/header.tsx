"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { FaRegUser } from "react-icons/fa";

export default function Header() {
    const path = usePathname();

    if (path.includes("/editor")) {
        return null; // Hide header on editor page
    }

    return (
        <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 text-nowrap">
            {/* Center - Glass Navigation Container */}

            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-8 py-2 flex items-center justify-between gap-8">
                {/* Logo */}
                <Link href="/" className="mr-10 md:mr-20">
                    <Image
                        src="/images/f.png"
                        alt="Fotora Logo"
                        className="h-16 w-16 object-cover"
                        width={100}
                        height={100}
                    />
                </Link>

                {path === "/" && (
                    <div className="hidden md:flex space-x-6">
                        <Link
                            href="#features"
                            className="text-white text-lg font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer"
                        >
                            Features
                        </Link>
                        <Link
                            href="#pricing"
                            className="text-white text-lg font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="#contact"
                            className="text-white text-lg font-medium transition-all duration-300 hover:text-cyan-400 cursor-pointer"
                        >
                            Contact
                        </Link>
                    </div>
                )}

                {/* Auth Actions */}
                <div className="flex items-center gap-3 ml-10 md:ml-20">
                    <div className="h-14 w-14 bg-neutral-500/10 rounded-full backdrop-blur-md flex justify-center items-center cursor-pointer  group">
                        <FaRegUser
                            size={20}
                            className="text-white group-hover:text-cyan-400 transition-all duration-300"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
