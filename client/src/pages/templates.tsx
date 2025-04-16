import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  Search, 
  Filter,
  UserCircle,
  Star,
  Copy
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

// Template type definition
interface Template {
  id: number;
  name: string;
  createdBy: number;
  teamId?: number;
  type: string;
  description?: string;
  questions: TemplateQuestion[];
  createdAt: string;
}

interface TemplateQuestion {
  id: number;
  templateId: number;
  text: string;
  type: 'text' | 'rating' | 'multiple_choice';
  options?: string[];
  required: boolean;
  order: number;
}

const TemplateCard = ({ template }: { template: Template }) => {
  const { toast } = useToast();
  
  const handleDuplicate = () => {
    toast({
      title: "Template duplicated",
      description: "The template has been duplicated successfully."
    });
  };

  // Determine the badge color based on template type
  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'okr review':
        return 'default';
      case 'okr check-in':
        return 'outline';
      case 'okr retro':
      case 'okr retrospective':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Preview of first few questions
  const previewQuestions = template.questions?.slice(0, 3) || [];

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium">{template.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <UserCircle className="h-3 w-3 mr-1" />
              Created by Admin
            </CardDescription>
          </div>
          <Badge variant={getBadgeVariant(template.type)}>
            {template.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {previewQuestions.map((question, index) => (
            <div key={index} className="text-sm">
              <span className="text-muted-foreground mr-2">{index + 1}.</span>
              {question.text}
              {question.type === 'rating' && (
                <span className="ml-2 text-amber-500">
                  <Star className="h-3 w-3 inline mb-1" />
                </span>
              )}
            </div>
          ))}
          
          {template.questions?.length > 3 && (
            <div className="text-sm text-muted-foreground">
              + {template.questions.length - 3} more questions
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" size="sm" onClick={handleDuplicate}>
          <Copy className="h-3.5 w-3.5 mr-1" />
          Duplicate
        </Button>
        <Button size="sm">
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
};

// Mock data for template questions
const mockTemplateQuestions = {
  'weekly-okr': [
    { id: 1, templateId: 1, text: 'What was your focus last week?', type: 'text', required: true, order: 1 },
    { id: 2, templateId: 1, text: 'What are your goals this week?', type: 'text', required: true, order: 2 }
  ],
  'okr-retro': [
    { id: 3, templateId: 2, text: 'Answer the following questions with your team.', type: 'text', required: false, order: 1 },
    { id: 4, templateId: 2, text: 'What are we proud of this cycle?', type: 'text', required: true, order: 2 },
    { id: 5, templateId: 2, text: 'What were the main challenges during this cycle?', type: 'text', required: true, order: 3 }
  ],
  'okr-review': [
    { id: 6, templateId: 3, text: 'You can use this template for a mid-term OKR Review or at the end of a cycle.', type: 'text', required: false, order: 1 },
    { id: 7, templateId: 3, text: 'Add your goals and explain the current progress. You can easily add goals from your OKRs.', type: 'text', required: true, order: 2 }
  ]
};

// Mock data for templates
const mockTemplates = [
  {
    id: 1,
    name: 'Weekly OKR Check-In',
    createdBy: 1,
    teamId: null,
    type: 'OKR Check-in',
    description: 'Weekly check-in template for OKRs',
    questions: mockTemplateQuestions['weekly-okr'],
    createdAt: '2023-09-01T12:00:00Z'
  },
  {
    id: 2,
    name: 'OKR Team Retro',
    createdBy: 1,
    teamId: null,
    type: 'OKR Retro',
    description: 'Template for team retrospectives',
    questions: mockTemplateQuestions['okr-retro'],
    createdAt: '2023-09-02T12:00:00Z'
  },
  {
    id: 3,
    name: 'OKR Review',
    createdBy: 1,
    teamId: null,
    type: 'OKR Review',
    description: 'Template for OKR reviews',
    questions: mockTemplateQuestions['okr-review'],
    createdAt: '2023-09-03T12:00:00Z'
  }
];

const TemplatesPage = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('OKR Check-in');
  const [templateTeam, setTemplateTeam] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateQuestions, setTemplateQuestions] = useState<Array<{
    text: string;
    type: 'text' | 'rating' | 'multiple_choice';
    required: boolean;
  }>>([
    { text: '', type: 'text', required: true }
  ]);
  
  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
  });
  
  // Placeholder for api fetch
  // const { data: templates, isLoading } = useQuery({
  //   queryKey: ['/api/templates'],
  // });
  
  // Using mock data for now
  const templates = mockTemplates;
  const isLoading = false;

  // Filter templates based on search and active tab
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    // You can add additional filtering based on activeTab if needed
    
    return matchesSearch;
  });

  const addQuestion = () => {
    setTemplateQuestions([
      ...templateQuestions,
      { text: '', type: 'text', required: true }
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...templateQuestions];
    // @ts-ignore - we know field exists on the object
    updatedQuestions[index][field] = value;
    setTemplateQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    if (templateQuestions.length === 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one question in the template",
        variant: "destructive"
      });
      return;
    }
    
    const updatedQuestions = [...templateQuestions];
    updatedQuestions.splice(index, 1);
    setTemplateQuestions(updatedQuestions);
  };

  const handleCreateTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive"
      });
      return;
    }

    if (templateQuestions.some(q => !q.text.trim())) {
      toast({
        title: "Error",
        description: "All questions must have text",
        variant: "destructive"
      });
      return;
    }

    // Here you would send the data to the API
    // const templateData = {
    //   name: templateName,
    //   type: templateType,
    //   teamId: templateTeam ? parseInt(templateTeam) : null,
    //   description: templateDescription,
    //   questions: templateQuestions.map((q, idx) => ({
    //     ...q,
    //     order: idx + 1
    //   }))
    // };

    // Reset form
    setTemplateName('');
    setTemplateType('OKR Check-in');
    setTemplateTeam('');
    setTemplateDescription('');
    setTemplateQuestions([{ text: '', type: 'text', required: true }]);
    setIsCreateDialogOpen(false);

    toast({
      title: "Template created",
      description: "The template has been created successfully."
    });
  };

  return (
    <DashboardLayout title="Templates" breadcrumb={[{label: "Check-ins", href: "/checkins"}, {label: "Templates", href: "/templates"}]}>
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-muted-foreground">Create and manage templates for check-ins</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a template for check-ins. Templates are reusable forms that can be used for your team's regular updates.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <Input 
                    placeholder="Template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Check-in Type
                  </label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OKR Check-in">OKR Check-in</SelectItem>
                      <SelectItem value="OKR Retrospective">OKR Retrospective</SelectItem>
                      <SelectItem value="OKR Review">OKR Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Team (Optional)
                </label>
                <Select value={templateTeam} onValueChange={setTemplateTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Teams</SelectItem>
                    {teams?.map((team: any) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <Textarea 
                  placeholder="Describe the purpose of this template..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-4">Questions</h3>
                
                {templateQuestions.map((question, index) => (
                  <div key={index} className="grid gap-3 mb-6 p-4 border rounded-md bg-slate-50">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="h-8 px-2 text-gray-500"
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Question Text
                      </label>
                      <Textarea 
                        placeholder="Enter your question..."
                        value={question.text}
                        onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Question Type
                        </label>
                        <Select 
                          value={question.type} 
                          onValueChange={(value) => updateQuestion(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={question.required}
                            onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                            className="h-4 w-4 mr-2"
                          />
                          <span className="text-sm">Required</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addQuestion} className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="my">My Templates</TabsTrigger>
            <TabsTrigger value="team">Team Templates</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            className="pl-9"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-200 rounded w-4/6"></div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex justify-between w-full">
                  <div className="h-8 bg-slate-200 rounded w-28"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default TemplatesPage;