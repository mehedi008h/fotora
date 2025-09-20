"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowLeft,
    RotateCcw,
    RotateCw,
    Crop,
    Expand,
    Sliders,
    Palette,
    Maximize2,
    ChevronDown,
    Text,
    RefreshCcw,
    Loader2,
    Eye,
    Save,
    Download,
    FileImage,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCanvas } from "@/context/context";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { FabricImage } from "fabric";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { toast } from "sonner";
import { Doc } from "@/convex/_generated/dataModel";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { UpgradeModal } from "../global/UpgradeModal";

//
// ------------------ Types ------------------
//
export type ToolId =
    | "resize"
    | "crop"
    | "adjust"
    | "text"
    | "background"
    | "ai_extender"
    | "ai_edit";

interface Tool {
    id: ToolId;
    label: string;
    icon: React.ElementType;
    proOnly?: boolean;
}

interface ExportConfig {
    format: "PNG" | "JPEG" | "WEBP";
    quality: number;
    label: string;
    extension: string;
}

interface EditorTopBarProps {
    project: Doc<"projects">;
}

type UserDoc = Doc<"users"> | null;

//
// ------------------ Configs ------------------
//
const TOOLS: Tool[] = [
    { id: "resize", label: "Resize", icon: Expand },
    { id: "crop", label: "Crop", icon: Crop },
    { id: "adjust", label: "Adjust", icon: Sliders },
    { id: "text", label: "Text", icon: Text },
    { id: "background", label: "AI Background", icon: Palette, proOnly: true },
    {
        id: "ai_extender",
        label: "AI Image Extender",
        icon: Maximize2,
        proOnly: true,
    },
    { id: "ai_edit", label: "AI Editing", icon: Eye, proOnly: true },
];

const EXPORT_FORMATS: ExportConfig[] = [
    {
        format: "PNG",
        quality: 1.0,
        label: "PNG (High Quality)",
        extension: "png",
    },
    {
        format: "JPEG",
        quality: 0.9,
        label: "JPEG (90% Quality)",
        extension: "jpg",
    },
    {
        format: "JPEG",
        quality: 0.8,
        label: "JPEG (80% Quality)",
        extension: "jpg",
    },
    {
        format: "WEBP",
        quality: 0.9,
        label: "WebP (90% Quality)",
        extension: "webp",
    },
];

//
// ------------------ Component ------------------
//
export function EditorTopBar({ project }: EditorTopBarProps) {
    const router = useRouter();
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [restrictedTool, setRestrictedTool] = useState<ToolId | undefined>(
        undefined
    );

    // Undo/Redo state
    const [undoStack, setUndoStack] = useState<string[]>([""]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false);

    const { activeTool, onToolChange, canvasEditor } = useCanvas();
    const { hasAccess, canExport, isFree } = usePlanAccess();

    const { mutate: updateProject, isLoading: isSaving } = useConvexMutation(
        api.projects.updateProject
    );
    const { data: user } = useConvexQuery(api.users.getCurrentUser);

    //
    // ------------------ Undo/Redo ------------------
    //
    const saveToUndoStack = () => {
        if (!canvasEditor || isUndoRedoOperation) return;

        const canvasState = JSON.stringify(canvasEditor.toJSON());
        setUndoStack((prev) => {
            const newStack = [...prev, canvasState];
            if (newStack.length > 20) newStack.shift();
            return newStack;
        });
        setRedoStack([]);
    };

    useEffect(() => {
        if (!canvasEditor) return;

        // Save initial state
        setTimeout(() => {
            if (canvasEditor && !isUndoRedoOperation) {
                const initialState = JSON.stringify(canvasEditor.toJSON());
                setUndoStack([initialState]);
            }
        }, 1000);

        const handleCanvasModified = () => {
            if (!isUndoRedoOperation) {
                setTimeout(() => {
                    if (!isUndoRedoOperation) saveToUndoStack();
                }, 500);
            }
        };

        canvasEditor.on("object:modified", handleCanvasModified);
        canvasEditor.on("object:added", handleCanvasModified);
        canvasEditor.on("object:removed", handleCanvasModified);
        canvasEditor.on("path:created", handleCanvasModified);

        return () => {
            canvasEditor.off("object:modified", handleCanvasModified);
            canvasEditor.off("object:added", handleCanvasModified);
            canvasEditor.off("object:removed", handleCanvasModified);
            canvasEditor.off("path:created", handleCanvasModified);
        };
    }, [canvasEditor, isUndoRedoOperation]);

    const handleUndo = async () => {
        if (!canvasEditor || undoStack.length <= 1) return;
        setIsUndoRedoOperation(true);

        try {
            const currentState = JSON.stringify(canvasEditor.toJSON());
            setRedoStack((prev) => [...prev, currentState]);

            const newUndoStack = [...undoStack];
            newUndoStack.pop();
            const previousState = newUndoStack.at(-1);

            if (previousState) {
                await canvasEditor.loadFromJSON(JSON.parse(previousState));
                canvasEditor.renderAll();
                setUndoStack(newUndoStack);
                toast.success("Undid last action");
            }
        } catch {
            toast.error("Failed to undo action");
        } finally {
            setTimeout(() => setIsUndoRedoOperation(false), 100);
        }
    };

    const handleRedo = async () => {
        if (!canvasEditor || redoStack.length === 0) return;
        setIsUndoRedoOperation(true);

        try {
            const newRedoStack = [...redoStack];
            const nextState = newRedoStack.pop();

            if (nextState) {
                const currentState = JSON.stringify(canvasEditor.toJSON());
                setUndoStack((prev) => [...prev, currentState]);

                await canvasEditor.loadFromJSON(JSON.parse(nextState));
                canvasEditor.renderAll();
                setRedoStack(newRedoStack);
                toast.success("Redid last action");
            }
        } catch {
            toast.error("Failed to redo action");
        } finally {
            setTimeout(() => setIsUndoRedoOperation(false), 100);
        }
    };

    //
    // ------------------ Actions ------------------
    //
    const handleBackToDashboard = () => router.push("/dashboard");

    const handleToolChange = (toolId: ToolId) => {
        if (!hasAccess(toolId)) {
            setRestrictedTool(toolId);
            setShowUpgradeModal(true);
            return;
        }
        onToolChange(toolId);
    };

    const handleManualSave = async () => {
        if (!canvasEditor || !project) {
            toast.error("Canvas not ready for saving");
            return;
        }
        try {
            const canvasJSON = canvasEditor.toJSON();
            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON,
            });
            toast.success("Project saved successfully!");
        } catch {
            toast.error("Failed to save project");
        }
    };

    const handleExport = async (exportConfig: ExportConfig) => {
        if (!canvasEditor || !project) {
            toast.error("Canvas not ready for export");
            return;
        }
        if (!canExport(user?.exportsThisMonth || 0)) {
            toast.error("Upgrade to export more images");
            return;
        }

        setIsExporting(true);
        setExportFormat(exportConfig.format);

        try {
            const currentZoom = canvasEditor.getZoom();
            const currentViewportTransform = [
                ...canvasEditor.viewportTransform,
            ];

            canvasEditor.setZoom(1);
            canvasEditor.setViewportTransform([1, 0, 0, 1, 0, 0]);
            canvasEditor.setDimensions({
                width: project.width,
                height: project.height,
            });
            canvasEditor.renderAll();

            const dataURL = canvasEditor.toDataURL({
                format: exportConfig.format.toLowerCase(),
                quality: exportConfig.quality,
                multiplier: 1,
            });

            // Restore
            canvasEditor.setZoom(currentZoom);
            canvasEditor.setViewportTransform(currentViewportTransform);
            canvasEditor.setDimensions({
                width: project.width * currentZoom,
                height: project.height * currentZoom,
            });
            canvasEditor.renderAll();

            const link = document.createElement("a");
            link.download = `${project.title}.${exportConfig.extension}`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Image exported as ${exportConfig.format}!`);
        } catch {
            toast.error("Failed to export image");
        } finally {
            setIsExporting(false);
            setExportFormat(null);
        }
    };

    const handleResetToOriginal = async () => {
        if (!canvasEditor || !project?.originalImageUrl) {
            toast.error("No original image found to reset to");
            return;
        }
        saveToUndoStack();

        try {
            canvasEditor.clear();
            canvasEditor.backgroundColor = "#ffffff";
            canvasEditor.backgroundImage = null;

            const fabricImage = await FabricImage.fromURL(
                project.originalImageUrl,
                {
                    crossOrigin: "anonymous",
                }
            );

            const imgAspect = fabricImage.width / fabricImage.height;
            const canvasAspect = project.width / project.height;
            const scale =
                imgAspect > canvasAspect
                    ? project.width / fabricImage.width
                    : project.height / fabricImage.height;

            fabricImage.set({
                left: project.width / 2,
                top: project.height / 2,
                originX: "center",
                originY: "center",
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
            });

            canvasEditor.add(fabricImage);
            canvasEditor.centerObject(fabricImage);
            canvasEditor.setActiveObject(fabricImage);
            canvasEditor.renderAll();

            const canvasJSON = canvasEditor.toJSON();
            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON,
                currentImageUrl: project.originalImageUrl,
                activeTransformations: undefined,
                backgroundRemoved: false,
            });

            toast.success("Canvas reset to original image");
        } catch {
            toast.error("Failed to reset canvas");
        }
    };

    //
    // ------------------ UI ------------------
    //
    const canUndo = undoStack.length > 1;
    const canRedo = redoStack.length > 0;

    return (
        <>
            <div className="border-b px-6 py-3">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToDashboard}
                            className="text-white hover:text-gray-300"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            All Projects
                        </Button>
                    </div>

                    <h1 className="font-extrabold capitalize">
                        {project.title}
                    </h1>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Reset */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetToOriginal}
                            disabled={isSaving || !project.originalImageUrl}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </>
                            )}
                        </Button>

                        {/* Save */}
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleManualSave}
                            disabled={isSaving || !canvasEditor}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save
                                </>
                            )}
                        </Button>

                        {/* Export */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="glass"
                                    size="sm"
                                    disabled={isExporting || !canvasEditor}
                                    className="gap-2"
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Exporting {exportFormat}...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Export
                                            <ChevronDown className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-56 bg-slate-800 border-slate-700"
                            >
                                <div className="px-3 py-2 text-sm text-white/70">
                                    Export Resolution: {project.width} ×{" "}
                                    {project.height}px
                                </div>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                {EXPORT_FORMATS.map((config, idx) => (
                                    <DropdownMenuItem
                                        key={idx}
                                        onClick={() => handleExport(config)}
                                        className="text-white hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                    >
                                        <FileImage className="h-4 w-4" />
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {config.label}
                                            </div>
                                            <div className="text-xs text-white/50">
                                                {config.format} •{" "}
                                                {Math.round(
                                                    config.quality * 100
                                                )}
                                                % quality
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="bg-slate-700" />
                                {isFree && (
                                    <div className="px-3 py-2 text-xs text-white/50">
                                        Free Plan: {user?.exportsThisMonth || 0}
                                        /20 exports this month
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Tools Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {TOOLS.map((tool) => {
                            const Icon = tool.icon;
                            const isActive = activeTool === tool.id;
                            const hasToolAccess = hasAccess(tool.id);

                            return (
                                <Button
                                    key={tool.id}
                                    variant={isActive ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleToolChange(tool.id)}
                                    className={`gap-2 relative ${
                                        isActive
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : "text-white hover:text-gray-300"
                                    } ${!hasToolAccess ? "opacity-60" : ""}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tool.label}
                                    {tool.proOnly && !hasToolAccess && (
                                        <Lock className="h-3 w-3 text-amber-400" />
                                    )}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Undo/Redo */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`text-white ${
                                !canUndo
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-slate-700"
                            }`}
                            onClick={handleUndo}
                            disabled={!canUndo || isUndoRedoOperation}
                            title={`Undo (${undoStack.length - 1} actions available)`}
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`text-white ${
                                !canRedo
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-slate-700"
                            }`}
                            onClick={handleRedo}
                            disabled={!canRedo || isUndoRedoOperation}
                            title={`Redo (${redoStack.length} actions available)`}
                        >
                            <RotateCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => {
                    setShowUpgradeModal(false);
                    setRestrictedTool(undefined);
                }}
                restrictedTool={
                    restrictedTool === "background" ||
                    restrictedTool === "ai_extender" ||
                    restrictedTool === "ai_edit"
                        ? restrictedTool
                        : undefined
                }
                reason={
                    isFree
                        ? "Free plan is limited to 20 exports per month. Upgrade to Pro for unlimited exports."
                        : undefined
                }
            />
        </>
    );
}
