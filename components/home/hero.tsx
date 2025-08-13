"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";

const HeroSection = () => {
    const [textVisible, setTextVisible] = useState(false);
    const [demoHovered, setDemoHovered] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setTextVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);
    return (
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <div className="text-center z-10 px-6">
                <div
                    className={`transition-all duration-1000 ${
                        textVisible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-10"
                    }`}
                >
                    <h1 className="text-6xl md:text-9xl font-black mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                            Create
                        </span>
                        <br />
                        <span className="text-white">Without Limits</span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                        Professional image editing powered by AI. Crop, resize,
                        adjust colors, remove backgrounds, and enhance your
                        images with cutting-edge technology.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                        <Link href="/dashboard">
                            <Button variant="primary" size="xl">
                                Start Creating
                            </Button>
                        </Link>
                        <Button variant="glass" size="xl">
                            Watch Demo
                        </Button>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: "✂️", label: "Crop" },
                        { icon: "📐", label: "Resize" },
                        { icon: "🎨", label: "Adjust" },
                        { icon: "🤖", label: "AI Tools" },
                    ].map((tool, index) => (
                        <div
                            key={index}
                            className="w-56 backdrop-blur-lg bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-all cursor-pointer"
                            title={tool.label}
                        >
                            <div className="text-2xl mb-1">{tool.icon}</div>
                            <div className="text-xs text-gray-400">
                                {tool.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
