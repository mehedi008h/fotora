"use client";

import React from "react";
import {
    Crop,
    Expand,
    Sliders,
    Palette,
    Maximize2,
    Text,
    Eye,
    LucideIcon,
} from "lucide-react";
import { useCanvas } from "@/context/context";
import { CropContent } from "./tools/CropContent";
import { ResizeControls } from "./tools/Resize";
import { AdjustControls } from "./tools/AdjustControls";
import { BackgroundControls } from "./tools/BackgroundControls";
import { AIExtenderControls } from "./tools/IExtender";
import { TextControls } from "./tools/Text";
import { AIEdit } from "./tools/AIEdit";
import { Doc } from "@/convex/_generated/dataModel";

type ToolKey =
    | "resize"
    | "crop"
    | "adjust"
    | "background"
    | "ai_extender"
    | "text"
    | "ai_edit";

interface ToolConfig {
    title: string;
    icon: LucideIcon;
    description: string;
}

const TOOL_CONFIGS: Record<ToolKey, ToolConfig> = {
    resize: {
        title: "Resize",
        icon: Expand,
        description: "Change project dimensions",
    },
    crop: {
        title: "Crop",
        icon: Crop,
        description: "Crop and trim your image",
    },
    adjust: {
        title: "Adjust",
        icon: Sliders,
        description: "Brightness, contrast, and more (Manual saving required)",
    },
    background: {
        title: "Background",
        icon: Palette,
        description: "Remove or change background",
    },
    ai_extender: {
        title: "AI Image Extender",
        icon: Maximize2,
        description: "Extend image boundaries with AI",
    },
    text: {
        title: "Add Text",
        icon: Text,
        description: "Customize in Various Fonts",
    },
    ai_edit: {
        title: "AI Editing",
        icon: Eye,
        description: "Enhance image quality with AI",
    },
};

interface EditorSidebarProps {
    project: Doc<"projects">;
}

export function EditorSidebar({ project }: EditorSidebarProps) {
    const { activeTool } = useCanvas() as { activeTool: ToolKey | null };

    const toolConfig = activeTool && TOOL_CONFIGS[activeTool];

    if (!toolConfig) return null;

    const Icon = toolConfig.icon;

    return (
        <div className="min-w-96 border-r flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">
                        {toolConfig.title}
                    </h2>
                </div>
                <p className="text-sm text-white mt-1">
                    {toolConfig.description}
                </p>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 p-4 overflow-y-scroll">
                {renderToolContent(activeTool, project)}
            </div>
        </div>
    );
}

const TOOL_COMPONENTS: Record<string, React.FC<any>> = {
    crop: CropContent,
    resize: ResizeControls,
    adjust: AdjustControls,
    background: BackgroundControls,
    ai_extender: AIExtenderControls,
    text: TextControls,
    ai_edit: AIEdit,
};

function renderToolContent(activeTool: string, project: any) {
    const ToolComponent = TOOL_COMPONENTS[activeTool];

    if (!ToolComponent) {
        return <div className="text-white">Select a tool to get started</div>;
    }

    return <ToolComponent project={project} />;
}
