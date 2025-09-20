"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@radix-ui/react-slider";
import {
    Type,
    Trash2,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
} from "lucide-react";
import { useCanvas } from "@/context/context";
import { IText } from "fabric";

const FONT_FAMILIES = [
    "Arial",
    "Arial Black",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Comic Sans MS",
    "Impact",
];

const FONT_SIZES = { min: 8, max: 120, default: 20 };

export function TextControls() {
    const { canvasEditor } = useCanvas();
    const [selectedText, setSelectedText] = useState<IText | null>(null);
    const [fontFamily, setFontFamily] = useState<string>("Arial");
    const [fontSize, setFontSize] = useState<number>(FONT_SIZES.default);
    const [textColor, setTextColor] = useState<string>("#000000");
    const [textAlign, setTextAlign] = useState<
        "left" | "center" | "right" | "justify"
    >("left");
    const [_, setChanged] = useState(0); // just for rerender

    // Check if selected object is text
    const updateSelectedText = () => {
        if (!canvasEditor) return;
        const activeObject = canvasEditor.getActiveObject();
        if (activeObject && activeObject.type === "i-text") {
            const textObj = activeObject as IText;
            setSelectedText(textObj);
            setFontFamily(textObj.fontFamily || "Arial");
            setFontSize(textObj.fontSize || FONT_SIZES.default);
            setTextColor((textObj.fill as string) || "#000000");
            setTextAlign(
                (textObj.textAlign as
                    | "left"
                    | "center"
                    | "right"
                    | "justify") || "left"
            );
        } else {
            setSelectedText(null);
        }
    };

    // Listen for selection changes
    useEffect(() => {
        if (!canvasEditor) return;

        updateSelectedText();

        const handleSelectionCreated = () => updateSelectedText();
        const handleSelectionUpdated = () => updateSelectedText();
        const handleSelectionCleared = () => setSelectedText(null);

        canvasEditor.on("selection:created", handleSelectionCreated);
        canvasEditor.on("selection:updated", handleSelectionUpdated);
        canvasEditor.on("selection:cleared", handleSelectionCleared);

        return () => {
            canvasEditor.off("selection:created", handleSelectionCreated);
            canvasEditor.off("selection:updated", handleSelectionUpdated);
            canvasEditor.off("selection:cleared", handleSelectionCleared);
        };
    }, [canvasEditor]);

    // Add new text
    const addText = () => {
        if (!canvasEditor) return;

        const text = new IText("Edit this text", {
            left: canvasEditor.width / 2,
            top: canvasEditor.height / 2,
            originX: "center",
            originY: "center",
            fontFamily,
            fontSize: FONT_SIZES.default,
            fill: textColor,
            textAlign,
            editable: true,
            selectable: true,
        });

        canvasEditor.add(text);
        canvasEditor.setActiveObject(text);
        canvasEditor.requestRenderAll();

        setTimeout(() => {
            text.enterEditing();
            text.selectAll();
        }, 100);
    };

    // Delete selected text
    const deleteSelectedText = () => {
        if (!canvasEditor || !selectedText) return;
        canvasEditor.remove(selectedText);
        canvasEditor.requestRenderAll();
        setSelectedText(null);
    };

    // Apply font family
    const applyFontFamily = (family: string) => {
        if (!selectedText) return;
        setFontFamily(family);
        selectedText.set("fontFamily", family);
        canvasEditor.requestRenderAll();
    };

    // Apply font size
    const applyFontSize = (size: number[] | number) => {
        if (!selectedText) return;
        const newSize = Array.isArray(size) ? size[0] : size;
        setFontSize(newSize);
        selectedText.set("fontSize", newSize);
        canvasEditor.requestRenderAll();
    };

    // Apply alignment
    const applyTextAlign = (
        alignment: "left" | "center" | "right" | "justify"
    ) => {
        if (!selectedText) return;
        setTextAlign(alignment);
        selectedText.set("textAlign", alignment);
        canvasEditor.requestRenderAll();
    };

    // Apply color
    const applyTextColor = (color: string) => {
        if (!selectedText) return;
        setTextColor(color);
        selectedText.set("fill", color);
        canvasEditor.requestRenderAll();
    };

    // Toggle formatting
    const toggleFormat = (format: "bold" | "italic" | "underline") => {
        if (!selectedText) return;

        switch (format) {
            case "bold": {
                const current = selectedText.fontWeight || "normal";
                selectedText.set(
                    "fontWeight",
                    current === "bold" ? "normal" : "bold"
                );
                break;
            }
            case "italic": {
                const current = selectedText.fontStyle || "normal";
                selectedText.set(
                    "fontStyle",
                    current === "italic" ? "normal" : "italic"
                );
                break;
            }
            case "underline": {
                const current = selectedText.underline || false;
                selectedText.set("underline", !current);
                break;
            }
        }

        canvasEditor.requestRenderAll();
        setChanged((c) => c + 1); // force rerender
    };

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Canvas not ready</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Add Text */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-white mb-2">
                        Add Text
                    </h3>
                    <p className="text-xs text-white/70 mb-4">
                        Click to add editable text to your canvas
                    </p>
                </div>
                <Button onClick={addText} className="w-full" variant="primary">
                    <Type className="h-4 w-4 mr-2" />
                    Add Text
                </Button>
            </div>

            {/* Text Editing */}
            {selectedText && (
                <div className="border-t border-white/10 pt-6">
                    <h3 className="text-sm font-medium text-white mb-4">
                        Edit Selected Text
                    </h3>

                    {/* Font Family */}
                    <div className="space-y-2 mb-4">
                        <label className="text-xs text-white/70">
                            Font Family
                        </label>
                        <select
                            value={fontFamily}
                            onChange={(e) => applyFontFamily(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-white/20 rounded text-white text-sm"
                        >
                            {FONT_FAMILIES.map((font) => (
                                <option key={font} value={font}>
                                    {font}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-white/70">
                                Font Size
                            </label>
                            <span className="text-xs text-white/70">
                                {fontSize}px
                            </span>
                        </div>
                        <Slider
                            value={[fontSize]}
                            onValueChange={applyFontSize}
                            min={FONT_SIZES.min}
                            max={FONT_SIZES.max}
                            step={1}
                            className="w-full"
                        />
                    </div>

                    {/* Alignment */}
                    <div className="space-y-2 mb-4">
                        <label className="text-xs text-white/70">
                            Text Alignment
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                            {[
                                ["left", AlignLeft],
                                ["center", AlignCenter],
                                ["right", AlignRight],
                                ["justify", AlignJustify],
                            ].map(([align, Icon]) => (
                                <Button
                                    key={align.length}
                                    onClick={() =>
                                        applyTextAlign(
                                            align as
                                                | "left"
                                                | "center"
                                                | "right"
                                                | "justify"
                                        )
                                    }
                                    variant={
                                        textAlign === align
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    className="p-2"
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Text Color */}
                    <div className="space-y-2 mb-4">
                        <label className="text-xs text-white/70">
                            Text Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => applyTextColor(e.target.value)}
                                className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer"
                            />
                            <Input
                                value={textColor}
                                onChange={(e) => applyTextColor(e.target.value)}
                                placeholder="#000000"
                                className="flex-1 bg-slate-700 border-white/20 text-white text-sm"
                            />
                        </div>
                    </div>

                    {/* Formatting */}
                    <div className="space-y-2 mb-4">
                        <label className="text-xs text-white/70">
                            Formatting
                        </label>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => toggleFormat("bold")}
                                variant={
                                    selectedText.fontWeight === "bold"
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                className="flex-1"
                            >
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={() => toggleFormat("italic")}
                                variant={
                                    selectedText.fontStyle === "italic"
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                className="flex-1"
                            >
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={() => toggleFormat("underline")}
                                variant={
                                    selectedText.underline
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                className="flex-1"
                            >
                                <Underline className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Delete */}
                    <Button
                        onClick={deleteSelectedText}
                        variant="outline"
                        className="w-full text-red-400 border-red-400/20 hover:bg-red-400/10"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Text
                    </Button>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-white/70">
                    <strong>Double-click</strong> any text to edit it directly
                    on canvas.
                    <br />
                    <strong>Select</strong> text to see formatting options here.
                </p>
            </div>
        </div>
    );
}
