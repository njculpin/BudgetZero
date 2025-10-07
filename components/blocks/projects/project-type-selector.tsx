"use client";

import { BookOpen, Box, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const projectTypes = [
  {
    type: "game" as const,
    icon: BookOpen,
    title: "Game Project",
    description:
      "Create rulebooks, design mechanics, build complete tabletop games",
    features: ["Rule editor", "Asset integration", "Collaborative editing"],
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    type: "model" as const,
    icon: Box,
    title: "3D Model",
    description:
      "Upload 3D printable models for miniatures, terrain, and components",
    features: ["STL uploads", "Preview renders", "Print specifications"],
    color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
  },
  {
    type: "illustration" as const,
    icon: Palette,
    title: "Illustration",
    description: "Share artwork, concept art, and visual assets for games",
    features: ["High-res uploads", "Multiple formats", "Usage licensing"],
    color: "bg-amber-50 hover:bg-amber-100 border-amber-200",
  },
];

export function ProjectTypeSelector() {
  const router = useRouter();

  const handleSelectType = (type: string) => {
    router.push(`/projects/${type}/new`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {projectTypes.map((projectType) => (
        <Card
          key={projectType.type}
          className={`cursor-pointer transition-all ${projectType.color} border-2`}
          onClick={() => handleSelectType(projectType.type)}
        >
          <CardHeader>
            <div className="flex items-center justify-between mb-3">
              <projectType.icon className="w-10 h-10 text-gray-700" />
            </div>
            <CardTitle className="text-xl">{projectType.title}</CardTitle>
            <CardDescription className="text-sm">
              {projectType.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {projectType.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="mr-2">
                  {feature}
                </Badge>
              ))}
            </div>
            <Button className="w-full" variant="default">
              Create {projectType.title}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
