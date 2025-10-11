"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Team {
  id: string;
  name: string;
  slug: string;
}

interface TeamSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  includePersonal?: boolean;
}

export function TeamSelector({
  value,
  onChange,
  placeholder = "Select owner",
  includePersonal = true,
}: TeamSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch("/api/teams");
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeams();
  }, []);

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includePersonal && (
          <SelectItem value="personal">Personal Account</SelectItem>
        )}
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
