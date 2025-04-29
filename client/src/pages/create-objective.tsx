import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Building,
  Calendar,
  ChevronDown,
  CircleUser,
  Code,
  Edit,
  LinkIcon,
  MoreHorizontal,
  NetworkIcon,
  Plus,
  Target, 
  Users,
  X,
  Check,
  Tag
} from "lucide-react";
import { useLocation } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getQueryFn } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  fullName: string;
  username: string;
  teamId: number | null;
}

interface Team {
  id: number;
  name: string;
  description: string | null;
  leaderId: number | null;
  memberCount: number | null;
}

export default function CreateObjective() {
  const [_, setLocation] = useLocation();
  const [alignmentOption, setAlignmentOption] = useState<string>("strategic-pillar");
  const [progressDriver, setProgressDriver] = useState<string>("key-results");
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContributors, setSelectedContributors] = useState<number[]>([]);
  
  // Set of tags based on request
  const availableTags = [
    "Innovation",
    "Customer Experience",
    "Growth",
    "Operational Excellence",
    "Sustainability"
  ];

  // Fetch teams from API
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch users from API
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Filter team members based on the selected team
  const teamMembers = users?.filter((user: User) => 
    selectedTeam && user.teamId === selectedTeam
  ) || [];

  const handleCancel = () => {
    setLocation("/");
  };

  const handleSave = () => {
    // Here you would normally save the data
    // After saving, redirect to create key result page
    setLocation("/create-key-result");
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(Number(teamId));
    // Reset selected contributors when team changes
    setSelectedContributors([]);
  };

  const handleContributorToggle = (userId: number) => {
    if (selectedContributors.includes(userId)) {
      setSelectedContributors(selectedContributors.filter(id => id !== userId));
    } else {
      setSelectedContributors([...selectedContributors, userId]);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add OKR</h1>
        <button 
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name">Name</Label>
          <div className="flex gap-2 mt-1">
            <Input 
              id="name" 
              placeholder="Our onboarding process is smooth and fast" 
              className="flex-1"
            />
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alignment */}
        <div>
          <Label>Alignment</Label>
          <div className="grid grid-cols-2 gap-4 mt-1">
            <Select defaultValue="strategic-pillar">
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  <span>Support a Strategic Pillar</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strategic-pillar">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-green-600" />
                    Support a Strategic Pillar
                  </div>
                </SelectItem>
                <SelectItem value="team-objective">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Support a Team Objective
                  </div>
                </SelectItem>
                <SelectItem value="company-objective">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-red-600" />
                    Support a Company Objective
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Strategic Pillar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="customer-satisfaction">Customer Satisfaction</SelectItem>
                <SelectItem value="innovation">Innovation</SelectItem>
                <SelectItem value="operational-excellence">Operational Excellence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Team (renamed from Owner) */}
        <div>
          <Label>Team</Label>
          <div className="mt-1">
            <Select onValueChange={handleTeamChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Team..." />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team: Team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    <div className="flex items-center">
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-sm mr-2">
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{team.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Contributors */}
        <div>
          <Label className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-600" />
            Contributors
          </Label>
          <div className="mt-1">
            {selectedTeam ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border border-dashed border-gray-300 rounded-md">
                  {selectedContributors.length > 0 ? (
                    selectedContributors.map(userId => {
                      const user = users.find(u => u.id === userId);
                      if (!user) return null;
                      const initials = user.fullName
                        .split(' ')
                        .map(name => name[0])
                        .join('')
                        .toUpperCase();
                      
                      return (
                        <Badge 
                          key={user.id} 
                          variant="outline" 
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.fullName}</span>
                          <button 
                            className="ml-1 text-gray-500 hover:text-gray-900"
                            onClick={() => handleContributorToggle(user.id)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 p-1">Select team members below to add contributors</p>
                  )}
                </div>
                
                <div className="mt-2 border rounded-md p-3 bg-gray-50">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-600" />
                    {teamMembers.length > 0 ? 'Team Members' : 'No team members found'}
                  </h4>
                  <div className="space-y-1">
                    {teamMembers.map(user => {
                      const initials = user.fullName
                        .split(' ')
                        .map(name => name[0])
                        .join('')
                        .toUpperCase();
                      const isSelected = selectedContributors.includes(user.id);
                      
                      return (
                        <div 
                          key={user.id}
                          className={`flex items-center p-2 rounded-md cursor-pointer ${
                            isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white'
                          }`}
                          onClick={() => handleContributorToggle(user.id)}
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1">{user.fullName}</span>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-blue-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border border-gray-300"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md mt-2 flex items-center">
                <ChevronDown className="h-4 w-4 mr-2" />
                Please select a team first to see available contributors.
              </p>
            )}
          </div>
        </div>

        {/* Lead and Timeframe */}
        <div className="grid grid-cols-2 gap-4">
          {/* Lead */}
          <div>
            <Label>Lead</Label>
            <div className="mt-1">
              <Select>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-medium text-sm mr-2">
                      BG
                    </div>
                    <span>Bonface Gitonga</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bonface">
                    <div className="flex items-center">
                      <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-medium text-sm mr-2">
                        BG
                      </div>
                      Bonface Gitonga
                    </div>
                  </SelectItem>
                  <SelectItem value="jane">
                    <div className="flex items-center">
                      <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-medium text-sm mr-2">
                        JD
                      </div>
                      Jane Doe
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <Label>Timeframe</Label>
            <div className="mt-1">
              <Select>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <span>Q2 2025</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q1-2025">Q1 2025</SelectItem>
                  <SelectItem value="q2-2025">Q2 2025</SelectItem>
                  <SelectItem value="q3-2025">Q3 2025</SelectItem>
                  <SelectItem value="q4-2025">Q4 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced-options">
            <AccordionTrigger className="text-blue-600 font-medium">
              Advanced Options
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-2">

                {/* Description */}
                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="description">Description</Label>
                    <span className="text-sm text-gray-500">Optional</span>
                  </div>
                  <Textarea 
                    id="description" 
                    placeholder="Why is it a priority?" 
                    className="mt-1 h-24"
                  />
                </div>

                {/* Update frequency */}
                <div>
                  <Label>Update frequency</Label>
                  <div className="mt-1">
                    <Select defaultValue="weekly">
                      <SelectTrigger className="w-full">
                        <span>Weekly</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Progress driver */}
                <div>
                  <Label>Progress driver</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div 
                      className={`border rounded-md p-4 flex items-center justify-between cursor-pointer ${
                        progressDriver === "key-results" ? "border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => setProgressDriver("key-results")}
                    >
                      <div className="flex items-center">
                        <div className={`h-4 w-4 rounded-full mr-2 flex items-center justify-center ${
                          progressDriver === "key-results" ? "bg-blue-500" : "border border-gray-300"
                        }`}>
                          {progressDriver === "key-results" && (
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span>Key Results</span>
                      </div>
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 flex items-center justify-between cursor-pointer ${
                        progressDriver === "aligned-okrs" ? "border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => setProgressDriver("aligned-okrs")}
                    >
                      <div className="flex items-center">
                        <div className={`h-4 w-4 rounded-full mr-2 flex items-center justify-center ${
                          progressDriver === "aligned-okrs" ? "bg-blue-500" : "border border-gray-300"
                        }`}>
                          {progressDriver === "aligned-okrs" && (
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span>Aligned OKRs</span>
                      </div>
                      <NetworkIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTags.length > 0 ? (
                        selectedTags.map(tag => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="py-1 flex items-center gap-1"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                            <button 
                              className="ml-1 text-gray-500 hover:text-gray-900"
                              onClick={() => handleTagToggle(tag)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No tags selected. Select from the preset tags below.</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                      {availableTags.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <Button
                            key={tag}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={isSelected ? 'bg-blue-600' : ''}
                            onClick={() => handleTagToggle(tag)}
                          >
                            {isSelected && <Check className="h-3 w-3 mr-1" />}
                            {tag}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Bottom buttons - Status and Save/Cancel */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
              Active
            </Button>
            <Button variant="outline">
              Draft
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}