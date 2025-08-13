"use client";
import { ReactNode, useState } from "react";
import { useIntersectionObserver } from "@/hooks/use-landing-hooks";

interface FeatureCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    delay = 0,
}) => {
    const [ref, isVisible] = useIntersectionObserver() as [
        React.RefObject<HTMLDivElement>,
        boolean
    ];
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            ref={ref}
            className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-8 transition-all duration-700 cursor-pointer ${
                isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
            } ${isHovered ? "scale-105 rotate-1 shadow-2xl" : ""}`}
            style={{ transitionDelay: `${delay}ms` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
    );
};

export default FeatureCard;
