"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { Doc } from "@/convex/_generated/dataModel"; // Import Convex types
import ProjectCard from "./ProjectCard";

interface ProjectGridProps {
    projects: Doc<"projects">[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
    const router = useRouter();

    const handleEditProject = (projectId: any) => {
        router.push(`/editor/${projectId}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
                <ProjectCard
                    key={project._id}
                    project={project}
                    onEdit={() => handleEditProject(project._id)}
                />
            ))}
        </div>
    );
}
