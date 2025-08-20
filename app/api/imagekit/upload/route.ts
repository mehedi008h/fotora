import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import { auth } from "@clerk/nextjs/server";

// Validate environment variables
if (
    !process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
    !process.env.IMAGEKIT_PRIVATE_KEY ||
    !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
) {
    throw new Error("Missing ImageKit environment variables");
}

// Initialize ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get("file");
        const fileName = formData.get("fileName");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "Invalid file" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedFileName =
            typeof fileName === "string"
                ? fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
                : "upload";
        const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`;

        // Upload to ImageKit
        const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: uniqueFileName,
            folder: "/projects",
        });

        // Generate thumbnail URL
        const thumbnailUrl = imagekit.url({
            src: uploadResponse.url,
            transformation: [
                {
                    width: 400,
                    height: 300,
                    crop: "maintain_ratio",
                    quality: 80,
                },
            ],
        });

        // Return upload data
        return NextResponse.json({
            success: true,
            url: uploadResponse.url,
            thumbnailUrl,
            fileId: uploadResponse.fileId,
            width: uploadResponse.width,
            height: uploadResponse.height,
            size: uploadResponse.size,
            name: uploadResponse.name,
        });
    } catch (err: unknown) {
        console.error("ImageKit upload error:", err);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to upload image",
                details: err instanceof Error ? err.message : String(err),
            },
            { status: 500 }
        );
    }
}
