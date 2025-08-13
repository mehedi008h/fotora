"use client";

import { useParallax } from "@/hooks/use-parallax";

export const FloatingShapes = () => {
    const scrollY = useParallax();

    type Shape = {
        id: number;
        size: string;
        position: string;
        gradient: string;
    };

    const shapes: Shape[] = [
        {
            id: 1,
            size: "w-72 h-72",
            position: "top-20 left-10",
            gradient: "from-blue-500 to-purple-600",
        },
        {
            id: 2,
            size: "w-96 h-96",
            position: "top-1/3 right-10",
            gradient: "from-cyan-400 to-blue-500",
        },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {shapes.map((shape: Shape) => (
                <div
                    key={shape.id}
                    className={`absolute ${shape.size} ${shape.position} bg-gradient-to-r ${shape.gradient} rounded-full blur-3xl opacity-20 animate-pulse`}
                    style={{
                        transform: `translateY(${scrollY * 0.5}px) rotate(${
                            scrollY * 0.1
                        }deg)`,
                    }}
                />
            ))}
        </div>
    );
};
