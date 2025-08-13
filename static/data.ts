export const FEATURES = [
    {
        icon: "✂️",
        title: "Smart Crop & Resize",
        description:
            "Interactive cropping with aspect ratio constraints and intelligent resizing that preserves image quality across any dimension.",
    },
    {
        icon: "🎨",
        title: "Color & Light Adjustment",
        description:
            "Professional-grade brightness, contrast, saturation controls with real-time preview and auto-enhance capabilities.",
    },
    {
        icon: "🤖",
        title: "AI Background Removal",
        description:
            "Remove or replace backgrounds instantly using advanced AI that detects complex edges and fine details with precision.",
    },
    {
        icon: "🔧",
        title: "AI Content Editor",
        description:
            "Edit images with natural language prompts. Remove objects, change elements, or add new content using generative AI.",
    },
    {
        icon: "📏",
        title: "Image Extender",
        description:
            "Expand your canvas in any direction with AI-powered generative fill that seamlessly blends new content with existing images.",
    },
    {
        icon: "⬆️",
        title: "AI Upscaler",
        description:
            "Enhance image resolution up to 4x using AI upscaling technology that preserves details and reduces artifacts.",
    },
];

export const PLANS = [
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
        planId: "cplan_2ywZwXjYQQipWYxjCmFZCgCgsTZ",
        buttonText: "Upgrade to Pro",
    },
];
