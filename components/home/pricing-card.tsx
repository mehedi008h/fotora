"use client";

import { useIntersectionObserver } from "@/hooks/use-landing-hooks";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";

declare global {
    interface Window {
        Clerk?: {
            __internal_openCheckout?: (options: {
                planId?: string;
                planPeriod: "month" | "year";
                subscriberType: "user" | "organization";
            }) => Promise<void>;
        };
    }
}

interface PricingCardProps {
    id: string;
    plan: string;
    price: number;
    features: string[];
    featured?: boolean;
    planId?: string;
    buttonText: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
    id,
    plan,
    price,
    features,
    featured = false,
    planId,
    buttonText,
}) => {
    const [ref, isVisible] = useIntersectionObserver();
    const [isHovered, setIsHovered] = useState(false);
    const { has } = useAuth();

    // TODO: Replace with actual subscription check
    const isCurrentPlan = id ? has?.({ plan: id }) : false;

    const handlePopup = async () => {
        if (isCurrentPlan) return;

        try {
            if (window.Clerk?.__internal_openCheckout) {
                await window.Clerk.__internal_openCheckout({
                    planId,
                    planPeriod: "month",
                    subscriberType: "user",
                });
            } else {
                console.warn("Clerk checkout not available");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error(
                "Something went wrong opening checkout. Please try again."
            );
        }
    };

    return (
        <div
            ref={ref}
            className={`relative backdrop-blur-lg border rounded-3xl p-8 transition-all duration-700 cursor-pointer
        ${
            featured
                ? "bg-gradient-to-b from-blue-500/20 to-purple-600/20 border-blue-400/50 scale-105"
                : "bg-white/5 border-white/10"
        }
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        ${isHovered ? "scale-110 rotate-1 z-10" : ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {featured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                        Most Popular
                    </div>
                </div>
            )}

            <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">{plan}</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                    ${price}
                    {price > 0 && (
                        <span className="text-lg text-gray-400">/month</span>
                    )}
                </div>

                <ul className="space-y-3 mb-8">
                    {features.map((feature, index) => (
                        <li
                            key={index}
                            className="flex items-center text-gray-300"
                        >
                            <span
                                aria-hidden="true"
                                className="text-green-400 mr-3 font-bold"
                            >
                                ✓
                            </span>
                            {feature}
                        </li>
                    ))}
                </ul>

                <Button
                    variant={featured ? "primary" : "glass"}
                    size="xl"
                    className="w-full"
                    onClick={handlePopup}
                    disabled={isCurrentPlan || !planId}
                >
                    {isCurrentPlan ? "Current Plan" : buttonText}
                </Button>
            </div>
        </div>
    );
};

// ----------------------------
// Pricing Section Component
// ----------------------------

const PRICING_PLANS: PricingCardProps[] = [
    {
        id: "free_user",
        plan: "Free",
        price: 0,
        features: [
            "3 projects maximum",
            "20 exports per month",
            "Basic crop & resize",
            "Color adjustments",
            "Text Tool",
        ],
        buttonText: "Get Started Free",
    },
    {
        id: "pro",
        plan: "Pro",
        price: 12,
        features: [
            "Unlimited projects",
            "Unlimited exports",
            "All Editing Tools",
            "AI Background Remover",
            "AI Image Extender",
            "AI Retouch, Upscaler and more",
        ],
        featured: true,
        planId: "cplan_31DUtMbxKbnuZ6L1bRoCWdqI5BH",
        buttonText: "Upgrade to Pro",
    },
];

const PricingSection: React.FC = () => {
    return (
        <section className="py-20" id="pricing">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-white mb-6">
                        Simple{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            Pricing
                        </span>
                    </h2>
                    <p className="text-xl text-gray-300">
                        Start free and upgrade when you need more power. No
                        hidden fees, cancel anytime.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {PRICING_PLANS.map((plan) => (
                        <PricingCard key={plan.id} {...plan} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
