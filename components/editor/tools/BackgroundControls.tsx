"use client";

import React, { useState, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import {
    Trash2,
    Palette,
    Image as ImageIcon,
    Search,
    Download,
    Loader2,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useCanvas } from "@/context/context";
import { FabricImage } from "fabric";
import { Doc } from "@/convex/_generated/dataModel";

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

interface BackgroundControlsProps {
    project: Doc<"projects">;
}

interface UnsplashImage {
    id: string;
    alt_description: string | null;
    urls: {
        small: string;
        regular: string;
    };
    user: {
        name: string;
    };
}

export function BackgroundControls({ project }: BackgroundControlsProps) {
    const { canvasEditor, processingMessage, setProcessingMessage } =
        useCanvas();
    const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    // Get the main image object from canvas
    const getMainImage = () => {
        if (!canvasEditor) return null;
        const objects = canvasEditor.getObjects();
        return objects.find((obj: any) => obj.type === "image") || null;
    };

    // Background removal using ImageKit
    const handleBackgroundRemoval = async (): Promise<void> => {
        const mainImage = getMainImage();
        if (!mainImage || !project) return;

        setProcessingMessage("Removing background with AI...");

        try {
            // Get the current image URL
            const currentImageUrl =
                project.currentImageUrl || project.originalImageUrl;

            // Create ImageKit transformation URL for background removal
            const bgRemovedUrl = currentImageUrl?.includes("ik.imagekit.io")
                ? `${currentImageUrl.split("?")[0]}?tr=e-bgremove`
                : currentImageUrl;

            if (!bgRemovedUrl) throw new Error("Invalid image URL");

            // Create new image with background removed
            const processedImage = await FabricImage.fromURL(bgRemovedUrl, {
                crossOrigin: "anonymous",
            });

            // Store the current properties before removing the old image
            const currentProps = {
                left: mainImage.left,
                top: mainImage.top,
                scaleX: mainImage.scaleX,
                scaleY: mainImage.scaleY,
                angle: mainImage.angle,
                originX: mainImage.originX,
                originY: mainImage.originY,
            };

            // Remove the old image and add the new one
            canvasEditor.remove(mainImage);
            processedImage.set(currentProps);
            canvasEditor.add(processedImage);

            // Update coordinates
            processedImage.setCoords();

            // Set as active object
            canvasEditor.setActiveObject(processedImage);
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();
        } catch (error) {
            console.error("Error removing background:", error);
            alert("Failed to remove background. Please try again.");
        } finally {
            setProcessingMessage(null);
        }
    };

    // Set canvas background color
    const handleColorBackground = (): void => {
        if (!canvasEditor) return;
        canvasEditor.backgroundColor = backgroundColor;
        canvasEditor.requestRenderAll();
    };

    // Remove canvas background (color + image)
    const handleRemoveBackground = (): void => {
        if (!canvasEditor) return;
        canvasEditor.backgroundColor = null;
        canvasEditor.backgroundImage = null;
        canvasEditor.requestRenderAll();
    };

    // Search Unsplash images
    const searchUnsplashImages = async (): Promise<void> => {
        if (!searchQuery.trim() || !UNSPLASH_ACCESS_KEY) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(
                    searchQuery
                )}&per_page=12`,
                {
                    headers: {
                        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to search images");

            const data = await response.json();
            setUnsplashImages(data.results || []);
        } catch (error) {
            console.error("Error searching Unsplash:", error);
            alert("Failed to search images. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    // Set image as canvas background
    const handleImageBackground = async (
        imageUrl: string,
        imageId: string
    ): Promise<void> => {
        if (!canvasEditor) return;

        setSelectedImageId(imageId);
        try {
            // Track Unsplash download (required by API guidelines)
            if (UNSPLASH_ACCESS_KEY) {
                fetch(`${UNSPLASH_API_URL}/photos/${imageId}/download`, {
                    headers: {
                        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                    },
                }).catch(() => {});
            }

            // Create fabric image
            const fabricImage = await FabricImage.fromURL(imageUrl, {
                crossOrigin: "anonymous",
            });

            const canvasWidth = project.width;
            const canvasHeight = project.height;

            const scaleX = canvasWidth / fabricImage.width;
            const scaleY = canvasHeight / fabricImage.height;

            const scale = Math.max(scaleX, scaleY); // cover mode

            fabricImage.set({
                scaleX: scale,
                scaleY: scale,
                originX: "center",
                originY: "center",
                left: canvasWidth / 2,
                top: canvasHeight / 2,
            });

            canvasEditor.backgroundImage = fabricImage;
            canvasEditor.requestRenderAll();
        } catch (error) {
            console.error("Error setting background image:", error);
            alert("Failed to set background image. Please try again.");
        } finally {
            setSelectedImageId(null);
        }
    };

    // Handle search on Enter key
    const handleSearchKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            searchUnsplashImages();
        }
    };

    if (!canvasEditor) {
        return (
            <div className="p-4">
                <p className="text-white/70 text-sm">Canvas not ready</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative h-full">
            {/* AI Background Removal */}
            <div className="space-y-4 pb-4 border-b border-white/10">
                <h3 className="text-sm font-medium text-white mb-2">
                    AI Background Removal
                </h3>
                <p className="text-xs text-white/70 mb-4">
                    Automatically remove the background from your image using AI
                </p>

                <Button
                    onClick={handleBackgroundRemoval}
                    disabled={!!processingMessage || !getMainImage()}
                    className="w-full"
                    variant="primary"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Image Background
                </Button>

                {!getMainImage() && (
                    <p className="text-xs text-amber-400">
                        Please add an image to the canvas first to remove its
                        background
                    </p>
                )}
            </div>

            {/* Background Tabs */}
            <Tabs defaultValue="color" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                    <TabsTrigger
                        value="color"
                        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                    >
                        <Palette className="h-4 w-4 mr-2" />
                        Color
                    </TabsTrigger>
                    <TabsTrigger
                        value="image"
                        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Image
                    </TabsTrigger>
                </TabsList>

                {/* Color Background */}
                <TabsContent value="color" className="space-y-4 mt-6">
                    <h3 className="text-sm font-medium text-white mb-2">
                        Solid Color Background
                    </h3>
                    <p className="text-xs text-white/70 mb-4">
                        Choose a solid color for your canvas background
                    </p>

                    <HexColorPicker
                        color={backgroundColor}
                        onChange={setBackgroundColor}
                        style={{ width: "100%" }}
                    />

                    <div className="flex items-center gap-2">
                        <Input
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            placeholder="#ffffff"
                            className="flex-1 bg-slate-700 border-white/20 text-white"
                        />
                        <div
                            className="w-10 h-10 rounded border border-white/20"
                            style={{ backgroundColor }}
                        />
                    </div>

                    <Button
                        onClick={handleColorBackground}
                        className="w-full"
                        variant="primary"
                    >
                        <Palette className="h-4 w-4 mr-2" />
                        Apply Color
                    </Button>
                </TabsContent>

                {/* Image Background */}
                <TabsContent value="image" className="space-y-4 mt-6">
                    <h3 className="text-sm font-medium text-white mb-2">
                        Image Background
                    </h3>
                    <p className="text-xs text-white/70 mb-4">
                        Search and use high-quality images from Unsplash
                    </p>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyPress}
                            placeholder="Search for backgrounds..."
                            className="flex-1 bg-slate-700 border-white/20 text-white"
                        />
                        <Button
                            onClick={searchUnsplashImages}
                            disabled={isSearching || !searchQuery.trim()}
                            variant="primary"
                        >
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Results */}
                    {unsplashImages.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-white">
                                Search Results ({unsplashImages.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                {unsplashImages.map((image) => (
                                    <div
                                        key={image.id}
                                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400 transition-colors"
                                        onClick={() =>
                                            handleImageBackground(
                                                image.urls.regular,
                                                image.id
                                            )
                                        }
                                    >
                                        <img
                                            src={image.urls.small}
                                            alt={
                                                image.alt_description ||
                                                "Background image"
                                            }
                                            className="w-full h-24 object-cover"
                                        />

                                        {/* Loading overlay */}
                                        {selectedImageId === image.id && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                                            </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Download className="h-5 w-5 text-white" />
                                        </div>

                                        {/* Attribution */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                                            <p className="text-xs text-white/80 truncate">
                                                by {image.user.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty States */}
                    {!isSearching &&
                        unsplashImages.length === 0 &&
                        searchQuery && (
                            <div className="text-center py-8">
                                <ImageIcon className="h-12 w-12 text-white/30 mx-auto mb-3" />
                                <p className="text-white/70 text-sm">
                                    No images found for "{searchQuery}"
                                </p>
                                <p className="text-white/50 text-xs">
                                    Try a different search term
                                </p>
                            </div>
                        )}

                    {!searchQuery && unsplashImages.length === 0 && (
                        <div className="text-center py-8">
                            <Search className="h-12 w-12 text-white/30 mx-auto mb-3" />
                            <p className="text-white/70 text-sm">
                                Search for background images
                            </p>
                            <p className="text-white/50 text-xs">
                                Powered by Unsplash
                            </p>
                        </div>
                    )}

                    {!UNSPLASH_ACCESS_KEY && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <p className="text-amber-400 text-xs">
                                Unsplash API key not configured. Please add
                                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY to your
                                environment variables.
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Clear Canvas Background */}
            <div className="pt-4 border-t border-white/10 bottom-0 w-full">
                <Button
                    onClick={handleRemoveBackground}
                    className="w-full"
                    variant="outline"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Canvas Background
                </Button>
            </div>
        </div>
    );
}
