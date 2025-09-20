"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Crop,
    CheckCheck,
    X,
    Square,
    RectangleHorizontal,
    RectangleVertical,
    Smartphone,
    Maximize,
} from "lucide-react";
import { useCanvas } from "@/context/context";
import { FabricImage, Rect } from "fabric";

// ---- Types ----
interface AspectRatio {
    label: string;
    value: number | null;
    icon: React.ComponentType<{ className?: string }>;
    ratio?: string;
}

interface OriginalProps {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    selectable?: boolean;
    evented?: boolean;
}

const ASPECT_RATIOS: AspectRatio[] = [
    { label: "Freeform", value: null, icon: Maximize },
    { label: "Square", value: 1, icon: Square, ratio: "1:1" },
    {
        label: "Widescreen",
        value: 16 / 9,
        icon: RectangleHorizontal,
        ratio: "16:9",
    },
    { label: "Portrait", value: 4 / 5, icon: RectangleVertical, ratio: "4:5" },
    { label: "Story", value: 9 / 16, icon: Smartphone, ratio: "9:16" },
];

export function CropContent() {
    const { canvasEditor, activeTool } = useCanvas();

    const [selectedImage, setSelectedImage] = useState<FabricImage | null>(
        null
    );
    const [isCropMode, setIsCropMode] = useState(false);
    const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
    const [cropRect, setCropRect] = useState<Rect | null>(null);
    const [originalProps, setOriginalProps] = useState<OriginalProps | null>(
        null
    );

    // Get the currently selected or main image
    const getActiveImage = (): FabricImage | null => {
        if (!canvasEditor) return null;

        const activeObject = canvasEditor.getActiveObject();
        if (activeObject && activeObject.type === "image") {
            return activeObject as FabricImage;
        }

        const objects = canvasEditor.getObjects();
        return (
            (objects.find((obj: any) => obj.type === "image") as FabricImage) ||
            null
        );
    };

    // Remove all Rect objects from canvas (cleanup crop rectangles)
    const removeAllCropRectangles = () => {
        if (!canvasEditor) return;

        const objects = canvasEditor.getObjects();
        const rectsToRemove = objects.filter((obj: any) => obj.type === "rect");

        rectsToRemove.forEach((rect: any) => {
            canvasEditor.remove(rect);
        });

        canvasEditor.requestRenderAll();
    };

    // Initialize crop mode when tool becomes active
    useEffect(() => {
        if (activeTool === "crop" && canvasEditor && isCropMode) {
            const image = getActiveImage();
            if (image) {
                initializeCropMode(image);
            }
        } else if (activeTool !== "crop" && isCropMode) {
            exitCropMode();
        }
    }, [activeTool, canvasEditor]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isCropMode) {
                exitCropMode();
            }
        };
    }, []);

    // Initialize crop mode
    const initializeCropMode = (image: FabricImage) => {
        if (!image || isCropMode) return;

        removeAllCropRectangles();

        const original: OriginalProps = {
            left: image.left,
            top: image.top,
            width: image.width,
            height: image.height,
            scaleX: image.scaleX,
            scaleY: image.scaleY,
            angle: image.angle || 0,
            selectable: image.selectable,
            evented: image.evented,
        };

        setOriginalProps(original);
        setSelectedImage(image);
        setIsCropMode(true);

        image.set({
            selectable: false,
            evented: false,
        });

        createCropRectangle(image);

        canvasEditor?.requestRenderAll();
    };

    // Create the crop rectangle overlay
    const createCropRectangle = (image: FabricImage) => {
        // Calculate image bounds on canvas
        const bounds = image.getBoundingRect();

        const cropRectangle = new Rect({
            left: bounds.left + bounds.width * 0.1,
            top: bounds.top + bounds.height * 0.1,
            width: bounds.width * 0.8,
            height: bounds.height * 0.8,
            fill: "transparent",
            stroke: "#00bcd4",
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: true,
            evented: true,
            name: "cropRect",
            cornerColor: "#00bcd4",
            cornerSize: 12,
            transparentCorners: false,
            cornerStyle: "circle",
            borderColor: "#00bcd4",
            borderScaleFactor: 1,
            // Add a custom property to identify crop rectangles
            isCropRectangle: true,
        });

        // Add custom control behavior
        cropRectangle.on("scaling", (e: any) => {
            const rect = e.target;

            // Apply aspect ratio constraint if selected
            if (selectedRatio && selectedRatio !== null) {
                const currentRatio =
                    (rect.width * rect.scaleX) / (rect.height * rect.scaleY);
                if (Math.abs(currentRatio - selectedRatio) > 0.01) {
                    // Adjust height to maintain ratio
                    const newHeight =
                        (rect.width * rect.scaleX) /
                        selectedRatio /
                        rect.scaleY;
                    rect.set("height", newHeight);
                }
            }

            canvasEditor.requestRenderAll();
        });

        canvasEditor.add(cropRectangle);
        canvasEditor.setActiveObject(cropRectangle);
        setCropRect(cropRectangle);
    };

    // Exit crop mode and cleanup
    const exitCropMode = () => {
        if (!isCropMode) return;

        removeAllCropRectangles();
        setCropRect(null);

        if (selectedImage && originalProps) {
            selectedImage.set({
                selectable: originalProps.selectable,
                evented: originalProps.evented,
                left: originalProps.left,
                top: originalProps.top,
                scaleX: originalProps.scaleX,
                scaleY: originalProps.scaleY,
                angle: originalProps.angle,
            });

            canvasEditor?.setActiveObject(selectedImage);
        }

        setIsCropMode(false);
        setSelectedImage(null);
        setOriginalProps(null);
        setSelectedRatio(null);

        canvasEditor?.requestRenderAll();
    };

    // Apply aspect ratio constraint
    const applyAspectRatio = (ratio: number | null) => {
        setSelectedRatio(ratio);

        if (!cropRect || ratio === null) return;

        const currentWidth = cropRect.width! * cropRect.scaleX!;
        const newHeight = currentWidth / ratio;

        cropRect.set({
            height: newHeight / cropRect.scaleY!,
            scaleY: cropRect.scaleX,
        });

        canvasEditor?.requestRenderAll();
    };

    // Apply crop
    const applyCrop = async () => {
        if (!selectedImage || !cropRect || !canvasEditor) return;

        try {
            const cropBounds = cropRect.getBoundingRect();
            const imageBounds = selectedImage.getBoundingRect();

            const cropX = Math.max(0, cropBounds.left - imageBounds.left);
            const cropY = Math.max(0, cropBounds.top - imageBounds.top);
            const cropWidth = Math.min(
                cropBounds.width,
                imageBounds.width - cropX
            );
            const cropHeight = Math.min(
                cropBounds.height,
                imageBounds.height - cropY
            );

            const imageScaleX = selectedImage.scaleX || 1;
            const imageScaleY = selectedImage.scaleY || 1;

            const actualCropX = cropX / imageScaleX;
            const actualCropY = cropY / imageScaleY;
            const actualCropWidth = cropWidth / imageScaleX;
            const actualCropHeight = cropHeight / imageScaleY;

            const croppedImage = new FabricImage(selectedImage.getElement(), {
                left: cropBounds.left + cropBounds.width / 2,
                top: cropBounds.top + cropBounds.height / 2,
                originX: "center",
                originY: "center",
                selectable: true,
                evented: true,
                cropX: actualCropX,
                cropY: actualCropY,
                width: actualCropWidth,
                height: actualCropHeight,
                scaleX: imageScaleX,
                scaleY: imageScaleY,
            });

            canvasEditor.remove(selectedImage);
            canvasEditor.add(croppedImage);
            canvasEditor.setActiveObject(croppedImage);
            canvasEditor.requestRenderAll();

            exitCropMode();
        } catch (error) {
            console.error("Error applying crop:", error);
            alert("Failed to apply crop. Please try again.");
            exitCropMode();
        }
    };

    const cancelCrop = () => {
        exitCropMode();
    };

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Canvas not ready</p>
            </div>
        );
    }

    const activeImage = getActiveImage();
    if (!activeImage && !isCropMode) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Select an image to crop</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isCropMode && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                    <p className="text-cyan-400 text-sm font-medium">
                        ✂️ Crop Mode Active
                    </p>
                    <p className="text-cyan-300/80 text-xs mt-1">
                        Adjust the blue rectangle to set crop area
                    </p>
                </div>
            )}

            {!isCropMode && activeImage && (
                <Button
                    onClick={() => initializeCropMode(activeImage)}
                    className="w-full"
                    variant="primary"
                >
                    <Crop className="h-4 w-4 mr-2" />
                    Start Cropping
                </Button>
            )}

            {isCropMode && (
                <div>
                    <h3 className="text-sm font-medium text-white mb-3">
                        Crop Aspect Ratios
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {ASPECT_RATIOS.map((ratio) => {
                            const IconComponent = ratio.icon;
                            return (
                                <button
                                    key={ratio.label}
                                    onClick={() =>
                                        applyAspectRatio(ratio.value)
                                    }
                                    className={`text-center p-3 border rounded-lg transition-colors cursor-pointer ${
                                        selectedRatio === ratio.value
                                            ? "border-cyan-400 bg-cyan-400/10"
                                            : "border-white/20 hover:border-white/40 hover:bg-white/5"
                                    }`}
                                >
                                    <IconComponent className="h-6 w-6 mx-auto mb-2 text-white" />
                                    <div className="text-xs text-white">
                                        {ratio.label}
                                    </div>
                                    {ratio.ratio && (
                                        <div className="text-xs text-white/70">
                                            {ratio.ratio}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {isCropMode && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                    <Button
                        onClick={applyCrop}
                        className="w-full"
                        variant="primary"
                    >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Apply Crop
                    </Button>

                    <Button
                        onClick={cancelCrop}
                        variant="outline"
                        className="w-full"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                </div>
            )}

            <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-white/70">
                    <strong>How to crop:</strong>
                    <br />
                    1. Click "Start Cropping"
                    <br />
                    2. Drag the blue rectangle to select crop area
                    <br />
                    3. Choose aspect ratio (optional)
                    <br />
                    4. Click "Apply Crop" to finalize
                </p>
            </div>
        </div>
    );
}
