"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";
import { useCanvas } from "@/context/context";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@/hooks/use-convex-query";

interface CanvasEditorProps {
    project: Doc<"projects">;
}

function CanvasEditor({ project }: CanvasEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { canvasEditor, setCanvasEditor, activeTool, onToolChange } =
        useCanvas();
    const [isLoading, setIsLoading] = useState(true);

    const { mutate: updateProject } = useConvexMutation(
        api.projects.updateProject
    );

    // Compute scale to fit the project size inside the container (with some padding)
    const calculateViewportScale = (): number => {
        if (!containerRef.current || !project) return 1;
        const container = containerRef.current;
        // 40px padding on both sides collectively
        const containerWidth = Math.max(container.clientWidth - 40, 1);
        const containerHeight = Math.max(container.clientHeight - 40, 1);
        const scaleX = containerWidth / project.width;
        const scaleY = containerHeight / project.height;
        return Math.min(scaleX, scaleY, 1);
    };

    // Initialize Fabric canvas
    useEffect(() => {
        if (!canvasRef.current || !project) return;

        let isMounted = true;
        setIsLoading(true);

        // ✅ Create a new canvas instance on this <canvas>
        const canvas = new Canvas(canvasRef.current, {
            width: project.width,
            height: project.height,
            backgroundColor: "#ffffff",
            preserveObjectStacking: true,
            controlsAboveOverlay: true,
            selection: true,
            hoverCursor: "move",
            moveCursor: "move",
            defaultCursor: "default",
            skipTargetFind: false,
            enableRetinaScaling: true,
            renderOnAddRemove: true,
        });

        const init = async () => {
            const viewportScale = calculateViewportScale();

            canvas.setDimensions(
                {
                    width: project.width * viewportScale,
                    height: project.height * viewportScale,
                },
                { backstoreOnly: false }
            );
            canvas.setZoom(viewportScale);
            canvas.requestRenderAll();

            // Sync both lower and upper canvas layers
            canvas.setDimensions(
                {
                    width: project.width * viewportScale,
                    height: project.height * viewportScale,
                },
                { backstoreOnly: false }
            );

            canvas.setZoom(viewportScale);

            // High DPI handling (optional, comment if you don’t need)
            const scaleFactor = window.devicePixelRatio || 1;
            if (scaleFactor > 1) {
                canvas.getElement().width = project.width * scaleFactor;
                canvas.getElement().height = project.height * scaleFactor;
                canvas.getContext().scale(scaleFactor, scaleFactor);
            }

            // Load image
            if (project.currentImageUrl || project.originalImageUrl) {
                try {
                    const imageUrl =
                        project.currentImageUrl || project.originalImageUrl;
                    const fabricImage = await FabricImage.fromURL(imageUrl, {
                        crossOrigin: "anonymous",
                    });

                    const imgAspectRatio =
                        fabricImage.width / fabricImage.height;
                    const canvasAspectRatio = project.width / project.height;
                    let scaleX, scaleY;

                    if (imgAspectRatio > canvasAspectRatio) {
                        scaleX = project.width / fabricImage.width;
                        scaleY = scaleX;
                    } else {
                        scaleY = project.height / fabricImage.height;
                        scaleX = scaleY;
                    }

                    fabricImage.set({
                        left: project.width / 2,
                        top: project.height / 2,
                        originX: "center",
                        originY: "center",
                        scaleX,
                        scaleY,
                        selectable: true,
                        evented: true,
                    });

                    canvas.add(fabricImage);
                    canvas.centerObject(fabricImage);
                } catch (error) {
                    console.error("Error loading project image:", error);
                }
            }

            // Load saved canvas state
            if (project.canvasState) {
                try {
                    await canvas.loadFromJSON(project.canvasState);
                    canvas.requestRenderAll();
                } catch (error) {
                    console.error("Error loading canvas state:", error);
                }
            }

            if (!isMounted) return;

            setCanvasEditor(canvas);

            // Trigger a resize event after init
            setTimeout(() => {
                window.dispatchEvent(new Event("resize"));
            }, 300);

            setIsLoading(false);
        };

        init();

        // ✅ Cleanup with this local canvas
        return () => {
            isMounted = false;
            canvas.dispose();
            setCanvasEditor(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project._id]);

    // Debounced autosave
    const saveCanvasState = async () => {
        if (!canvasEditor || !project) return;
        try {
            const canvasJSON = canvasEditor.toJSON();
            await updateProject({
                projectId: project._id,
                canvasState: canvasJSON,
            });
        } catch (error) {
            console.error("Error saving canvas state:", error);
        }
    };

    useEffect(() => {
        if (!canvasEditor) return;

        let saveTimeout: ReturnType<typeof setTimeout> | null = null;

        const handleCanvasChange = () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCanvasState();
            }, 2000);
        };

        canvasEditor.on("object:modified", handleCanvasChange);
        canvasEditor.on("object:added", handleCanvasChange);
        canvasEditor.on("object:removed", handleCanvasChange);
        canvasEditor.on("path:created", handleCanvasChange);

        return () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            canvasEditor.off("object:modified", handleCanvasChange);
            canvasEditor.off("object:added", handleCanvasChange);
            canvasEditor.off("object:removed", handleCanvasChange);
            canvasEditor.off("path:created", handleCanvasChange);
        };
    }, [canvasEditor]);

    // Cursor mode per active tool
    useEffect(() => {
        if (!canvasEditor) return;

        switch (activeTool) {
            case "crop":
                canvasEditor.defaultCursor = "crosshair";
                canvasEditor.hoverCursor = "crosshair";
                break;
            default:
                canvasEditor.defaultCursor = "default";
                canvasEditor.hoverCursor = "move";
        }
        canvasEditor.requestRenderAll();
    }, [canvasEditor, activeTool]);

    // Resize responsiveness
    useEffect(() => {
        const handleResize = () => {
            if (!canvasEditor || !project) return;

            const newScale = calculateViewportScale();
            canvasEditor.setDimensions(
                {
                    width: project.width * newScale,
                    height: project.height * newScale,
                },
                { backstoreOnly: false }
            );
            canvasEditor.setZoom(newScale);
            canvasEditor.requestRenderAll();
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasEditor, project?._id]);

    // Auto-switch to Text tool if an i-text object is selected
    useEffect(() => {
        if (!canvasEditor || !onToolChange) return;

        const handleSelection = (e: any) => {
            const selectedObject = e.selected?.[0];
            if (selectedObject && selectedObject.type === "i-text") {
                onToolChange("text");
            }
        };

        canvasEditor.on("selection:created", handleSelection);
        canvasEditor.on("selection:updated", handleSelection);

        return () => {
            canvasEditor.off("selection:created", handleSelection);
            canvasEditor.off("selection:updated", handleSelection);
        };
    }, [canvasEditor, onToolChange]);

    return (
        <div
            ref={containerRef}
            className="relative flex items-center justify-center bg-secondary w-full h-full overflow-hidden"
        >
            {/* checkerboard backdrop */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(45deg, #64748b 25%, transparent 25%),
            linear-gradient(-45deg, #64748b 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #64748b 75%),
            linear-gradient(-45deg, transparent 75%, #64748b 75%)`,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
            />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                        <p className="text-white/70 text-sm">
                            Loading canvas...
                        </p>
                    </div>
                </div>
            )}

            <div className="px-5">
                <canvas id="canvas" className="border" ref={canvasRef} />
            </div>
        </div>
    );
}

export default CanvasEditor;
