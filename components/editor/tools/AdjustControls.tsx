"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "@radix-ui/react-slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { filters, Image } from "fabric";
import { useCanvas } from "@/context/context";

// --------------------
// Types
// --------------------
interface FilterConfig {
    key: keyof FilterValues;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    filterClass: new (options?: any) => any;
    valueKey: string;
    transform: (value: number) => number;
    suffix?: string;
}

type FilterValues = {
    brightness: number;
    contrast: number;
    saturation: number;
    vibrance: number;
    blur: number;
    hue: number;
};

// --------------------
// Filter Configurations
// --------------------
const FILTER_CONFIGS: FilterConfig[] = [
    {
        key: "brightness",
        label: "Brightness",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Brightness,
        valueKey: "brightness",
        transform: (value: number) => value / 100,
    },
    {
        key: "contrast",
        label: "Contrast",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Contrast,
        valueKey: "contrast",
        transform: (value: number) => value / 100,
    },
    {
        key: "saturation",
        label: "Saturation",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Saturation,
        valueKey: "saturation",
        transform: (value: number) => value / 100,
    },
    {
        key: "vibrance",
        label: "Vibrance",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Vibrance,
        valueKey: "vibrance",
        transform: (value: number) => value / 100,
    },
    {
        key: "blur",
        label: "Blur",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        filterClass: filters.Blur,
        valueKey: "blur",
        transform: (value: number) => value / 100,
    },
    {
        key: "hue",
        label: "Hue",
        min: -180,
        max: 180,
        step: 1,
        defaultValue: 0,
        filterClass: filters.HueRotation,
        valueKey: "rotation",
        transform: (value: number) => value * (Math.PI / 180),
        suffix: "°",
    },
];

// --------------------
// Default Values
// --------------------
const DEFAULT_VALUES: FilterValues = FILTER_CONFIGS.reduce((acc, config) => {
    acc[config.key] = config.defaultValue;
    return acc;
}, {} as FilterValues);

// --------------------
// Component
// --------------------
export function AdjustControls() {
    const [filterValues, setFilterValues] =
        useState<FilterValues>(DEFAULT_VALUES);
    const [isApplying, setIsApplying] = useState(false);
    const { canvasEditor } = useCanvas();

    // Get active image
    const getActiveImage = (): Image | null => {
        if (!canvasEditor) return null;
        const activeObject = canvasEditor.getActiveObject();
        if (activeObject && activeObject.type === "image") {
            return activeObject as Image;
        }
        const objects = canvasEditor.getObjects();
        return (
            (objects.find((obj: any) => obj.type === "image") as Image) || null
        );
    };

    // Apply filters
    const applyFilters = async (newValues: FilterValues) => {
        const imageObject = getActiveImage();
        if (!imageObject || isApplying) return;

        setIsApplying(true);

        try {
            const filtersToApply: any[] = [];

            FILTER_CONFIGS.forEach((config) => {
                const value = newValues[config.key];
                if (value !== config.defaultValue) {
                    const transformedValue = config.transform(value);
                    filtersToApply.push(
                        new config.filterClass({
                            [config.valueKey]: transformedValue,
                        })
                    );
                }
            });

            // Preserve other non-adjustment filters
            imageObject.filters = [
                ...(imageObject.filters?.filter(
                    (f) =>
                        !FILTER_CONFIGS.some((c) => f instanceof c.filterClass)
                ) || []),
                ...filtersToApply,
            ];

            await new Promise((resolve) => {
                imageObject.applyFilters();
                canvasEditor.requestRenderAll();
                setTimeout(resolve, 50);
            });
        } catch (error) {
            console.error("Error applying filters:", error);
        } finally {
            setIsApplying(false);
        }
    };

    // Handle slider / input changes
    const handleValueChange = (
        filterKey: keyof FilterValues,
        value: number | number[]
    ) => {
        const newValues: FilterValues = {
            ...filterValues,
            [filterKey]: Array.isArray(value) ? value[0] : value,
        };
        setFilterValues(newValues);
        applyFilters(newValues);
    };

    // Reset
    const resetFilters = () => {
        setFilterValues(DEFAULT_VALUES);
        applyFilters(DEFAULT_VALUES);
    };

    // Extract existing filter values
    const extractFilterValues = (imageObject: Image): FilterValues => {
        if (!imageObject?.filters?.length) return DEFAULT_VALUES;

        const extractedValues: FilterValues = { ...DEFAULT_VALUES };

        imageObject.filters.forEach((filter) => {
            const config = FILTER_CONFIGS.find(
                (c) => c.filterClass.name === filter.constructor.name
            );
            if (config) {
                const filterValue = (filter as any)[config.valueKey];
                if (config.key === "hue") {
                    extractedValues[config.key] = Math.round(
                        filterValue * (180 / Math.PI)
                    );
                } else {
                    extractedValues[config.key] = Math.round(filterValue * 100);
                }
            }
        });

        return extractedValues;
    };

    // Sync values when image changes
    useEffect(() => {
        const imageObject = getActiveImage();
        if (imageObject?.filters) {
            const existingValues = extractFilterValues(imageObject);
            setFilterValues(existingValues);
        }
    }, [canvasEditor]);

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">
                    Load an image to start adjusting
                </p>
            </div>
        );
    }

    const activeImage = getActiveImage();
    if (!activeImage) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">
                    Select an image to adjust filters
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-white">
                    Image Adjustments
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-white/70 hover:text-white"
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
            </div>

            {/* Sliders */}
            {FILTER_CONFIGS.map((config) => (
                <div key={config.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm text-white">
                            {config.label}
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/70">
                                {filterValues[config.key]}
                                {config.suffix || ""}
                            </span>
                            <input
                                type="number"
                                className="w-16 text-xs bg-slate-800 text-white rounded p-1"
                                value={filterValues[config.key]}
                                min={config.min}
                                max={config.max}
                                step={config.step}
                                onChange={(e) =>
                                    handleValueChange(
                                        config.key,
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </div>
                    </div>
                    <Slider
                        value={[filterValues[config.key]]}
                        onValueChange={(value) =>
                            handleValueChange(config.key, value)
                        }
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        className="w-full"
                    />
                </div>
            ))}

            {/* Info */}
            <div className="mt-6 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-white/70">
                    Adjustments are applied in real-time. Use the Reset button
                    to restore original values.
                </p>
            </div>

            {/* Loader */}
            {isApplying && (
                <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                    <span className="ml-2 text-xs text-white/70">
                        Applying filters...
                    </span>
                </div>
            )}
        </div>
    );
}
