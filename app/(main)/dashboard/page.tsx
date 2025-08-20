"use client";
import CreateProjectModal from "@/components/dashboard/CreateProjectModal";
import EmptyState from "@/components/dashboard/EmptyState";
import { ProjectGrid } from "@/components/dashboard/ProjectGrid";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Plus } from "lucide-react";
import React, { useState } from "react";

const DashboardPage = () => {
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    // Get user's projects
    const { data: projects, isLoading } = useConvexQuery(
        api.projects.getUserProjects
    );

    const handleCreateProject = () => {
        setShowNewProjectModal(true);
    };
    return (
        <div className="min-h-screen pt-32 pb-16">
            <div className="container mx-auto px-6">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Your Projects
                        </h1>
                        <p className="text-white/70">
                            Create and manage your AI-powered image designs
                        </p>
                    </div>

                    <Button
                        onClick={handleCreateProject}
                        variant="primary"
                        size="lg"
                        className="gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        New Project
                    </Button>
                </div>

                {/* Projects Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                    </div>
                ) : projects && projects.length > 0 ? (
                    <ProjectGrid projects={projects} />
                ) : (
                    <EmptyState onClick={handleCreateProject} />
                )}

                {/* New Project Modal */}
                <CreateProjectModal
                    isOpen={showNewProjectModal}
                    onClose={() => setShowNewProjectModal(false)}
                />
            </div>
        </div>
    );
};

export default DashboardPage;
