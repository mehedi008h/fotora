import React from "react";
import { Button } from "../ui/button";
import { Image, Sparkles } from "lucide-react";

interface EmptyStateProps {
    onClick: () => void;
}

const EmptyState = ({ onClick }: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                <Image className="h-12 w-12 text-cyan-400" />
            </div>

            <h3 className="text-2xl font-semibold text-white mb-3">
                Create Your First Project
            </h3>

            <p className="text-white/70 mb-8 max-w-md">
                Upload an image to start editing with our powerful AI tools, or
                create a blank canvas to design from scratch.
            </p>

            <Button
                onClick={onClick}
                variant="primary"
                size="xl"
                className="gap-2"
            >
                <Sparkles className="h-5 w-5" />
                Start Creating
            </Button>
        </div>
    );
};

export default EmptyState;
