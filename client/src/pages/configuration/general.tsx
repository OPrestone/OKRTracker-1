import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Building,
  Bell,
  FileText,
  Tag,
  Shield,
  Save
} from "lucide-react";

const General = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");

  // Company details state
  const [companyName, setCompanyName] = useState("Your Company");
  const [companyDescription, setCompanyDescription] = useState("Brief description of your company");
  const [companyWebsite, setCompanyWebsite] = useState("https://yourcompany.com");

  // Features state
  const [features, setFeatures] = useState({
    keyResultAlignment: true,
    initiativesTracking: true,
    checkIns: true,
    progressReporting: true,
    teamHierarchy: true,
    userAccessGroups: true,
    customStatuses: true,
    templates: true
  });

  // Progress reporting state
  const [progressReporting, setProgressReporting] = useState({
    weeklyReminders: true,
    biWeeklyReports: true,
    monthlyReports: true,
    quarterlyReports: true
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    objectiveCreated: true,
    objectiveUpdated: true,
    keyResultCreated: true,
    keyResultProgress: true,
    checkInCreated: true,
    teamMemberAdded: true,
    reportGenerated: true,
    adminNotifications: true
  });

  // Tags state
  const [tags, setTags] = useState([
    { id: 1, name: "High Priority", color: "#ef4444" },
    { id: 2, name: "Strategic", color: "#3b82f6" },
    { id: 3, name: "Development", color: "#10b981" },
    { id: 4, name: "Marketing", color: "#f59e0b" }
  ]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

  // Security state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordExpiry: true,
    sensitiveDataAccess: false,
    auditLogging: true
  });

  const handleFeatureToggle = (feature: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handleProgressReportingToggle = (setting: keyof typeof progressReporting) => {
    setProgressReporting(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleNotificationToggle = (notification: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [notification]: !prev[notification] }));
  };

  const handleSecurityToggle = (setting: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      setTags([...tags, { id: tags.length + 1, name: newTagName.trim(), color: newTagColor }]);
      setNewTagName("");
      setNewTagColor("#3b82f6");
    }
  };

  const handleRemoveTag = (id: number) => {
    setTags(tags.filter(tag => tag.id !== id));
  };

  const handleSaveGeneral = () => {
    toast({
      title: "Settings saved",
      description: "Your general settings have been updated successfully."
    });
  };

  return (
    <DashboardLayout title="General Configuration">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">General Configuration</h1>
        <p className="text-gray-600">Manage general settings for your OKR system</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden md:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="reporting" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Reporting</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden md:inline">Tags</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Details */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>
                Configure your company information for the OKR system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input 
                  id="company-name" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-description">Description</Label>
                <Textarea 
                  id="company-description" 
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-website">Website URL</Label>
                <Input 
                  id="company-website" 
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Company Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Configuration */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Features Configuration</CardTitle>
              <CardDescription>
                Enable or disable various features of the OKR system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="key-result-alignment">Key Result Alignment</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow key results to be aligned with other objectives
                    </p>
                  </div>
                  <Switch
                    id="key-result-alignment"
                    checked={features.keyResultAlignment}
                    onCheckedChange={() => handleFeatureToggle("keyResultAlignment")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="initiatives-tracking">Initiatives Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Track initiatives linked to key results
                    </p>
                  </div>
                  <Switch
                    id="initiatives-tracking"
                    checked={features.initiativesTracking}
                    onCheckedChange={() => handleFeatureToggle("initiativesTracking")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="check-ins">Check-ins</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable regular progress check-ins
                    </p>
                  </div>
                  <Switch
                    id="check-ins"
                    checked={features.checkIns}
                    onCheckedChange={() => handleFeatureToggle("checkIns")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="progress-reporting">Progress Reporting</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate automated progress reports
                    </p>
                  </div>
                  <Switch
                    id="progress-reporting"
                    checked={features.progressReporting}
                    onCheckedChange={() => handleFeatureToggle("progressReporting")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="team-hierarchy">Team Hierarchy</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable hierarchical team structures
                    </p>
                  </div>
                  <Switch
                    id="team-hierarchy"
                    checked={features.teamHierarchy}
                    onCheckedChange={() => handleFeatureToggle("teamHierarchy")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="user-access-groups">User Access Groups</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable custom access groups for users
                    </p>
                  </div>
                  <Switch
                    id="user-access-groups"
                    checked={features.userAccessGroups}
                    onCheckedChange={() => handleFeatureToggle("userAccessGroups")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="custom-statuses">Custom Statuses</Label>
                    <p className="text-sm text-muted-foreground">
                      Create custom statuses for objectives and key results
                    </p>
                  </div>
                  <Switch
                    id="custom-statuses"
                    checked={features.customStatuses}
                    onCheckedChange={() => handleFeatureToggle("customStatuses")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="templates">Templates</Label>
                    <p className="text-sm text-muted-foreground">
                      Create and use templates for OKRs
                    </p>
                  </div>
                  <Switch
                    id="templates"
                    checked={features.templates}
                    onCheckedChange={() => handleFeatureToggle("templates")}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Feature Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Reporting */}
        <TabsContent value="reporting">
          <Card>
            <CardHeader>
              <CardTitle>Progress Reporting Configuration</CardTitle>
              <CardDescription>
                Configure automated progress reports and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-reminders">Weekly Check-in Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send weekly reminders for check-ins to users
                    </p>
                  </div>
                  <Switch
                    id="weekly-reminders"
                    checked={progressReporting.weeklyReminders}
                    onCheckedChange={() => handleProgressReportingToggle("weeklyReminders")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="bi-weekly-reports">Bi-weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate bi-weekly progress reports
                    </p>
                  </div>
                  <Switch
                    id="bi-weekly-reports"
                    checked={progressReporting.biWeeklyReports}
                    onCheckedChange={() => handleProgressReportingToggle("biWeeklyReports")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="monthly-reports">Monthly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate monthly progress reports
                    </p>
                  </div>
                  <Switch
                    id="monthly-reports"
                    checked={progressReporting.monthlyReports}
                    onCheckedChange={() => handleProgressReportingToggle("monthlyReports")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="quarterly-reports">Quarterly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate quarterly progress reports
                    </p>
                  </div>
                  <Switch
                    id="quarterly-reports"
                    checked={progressReporting.quarterlyReports}
                    onCheckedChange={() => handleProgressReportingToggle("quarterlyReports")}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Reporting Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure which events should trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="objective-created">Objective Created</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new objectives are created
                    </p>
                  </div>
                  <Switch
                    id="objective-created"
                    checked={notifications.objectiveCreated}
                    onCheckedChange={() => handleNotificationToggle("objectiveCreated")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="objective-updated">Objective Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when objectives are updated
                    </p>
                  </div>
                  <Switch
                    id="objective-updated"
                    checked={notifications.objectiveUpdated}
                    onCheckedChange={() => handleNotificationToggle("objectiveUpdated")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="key-result-created">Key Result Created</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new key results are created
                    </p>
                  </div>
                  <Switch
                    id="key-result-created"
                    checked={notifications.keyResultCreated}
                    onCheckedChange={() => handleNotificationToggle("keyResultCreated")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="key-result-progress">Key Result Progress</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when key result progress changes
                    </p>
                  </div>
                  <Switch
                    id="key-result-progress"
                    checked={notifications.keyResultProgress}
                    onCheckedChange={() => handleNotificationToggle("keyResultProgress")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="check-in-created">Check-in Created</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new check-ins are created
                    </p>
                  </div>
                  <Switch
                    id="check-in-created"
                    checked={notifications.checkInCreated}
                    onCheckedChange={() => handleNotificationToggle("checkInCreated")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="team-member-added">Team Member Added</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new members are added to your team
                    </p>
                  </div>
                  <Switch
                    id="team-member-added"
                    checked={notifications.teamMemberAdded}
                    onCheckedChange={() => handleNotificationToggle("teamMemberAdded")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="report-generated">Report Generated</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when reports are generated
                    </p>
                  </div>
                  <Switch
                    id="report-generated"
                    checked={notifications.reportGenerated}
                    onCheckedChange={() => handleNotificationToggle("reportGenerated")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="admin-notifications">Admin Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about admin events
                    </p>
                  </div>
                  <Switch
                    id="admin-notifications"
                    checked={notifications.adminNotifications}
                    onCheckedChange={() => handleNotificationToggle("adminNotifications")}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags */}
        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Tag Management</CardTitle>
              <CardDescription>
                Create and manage tags for objectives, key results, and initiatives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Tags</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: tag.color }}></div>
                        <span>{tag.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveTag(tag.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <Label>Add New Tag</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-10 h-10 p-1 rounded border"
                    />
                    <Button onClick={handleAddTag}>Add Tag</Button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Tag Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security and Privacy</CardTitle>
              <CardDescription>
                Configure security settings for the OKR system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require two-factor authentication for all users
                    </p>
                  </div>
                  <Switch
                    id="two-factor-auth"
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={() => handleSecurityToggle("twoFactorAuth")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password-expiry">Password Expiry</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce password expiry every 90 days
                    </p>
                  </div>
                  <Switch
                    id="password-expiry"
                    checked={securitySettings.passwordExpiry}
                    onCheckedChange={() => handleSecurityToggle("passwordExpiry")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sensitive-data-access">Restricted Sensitive Data Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Limit access to sensitive data to admins only
                    </p>
                  </div>
                  <Switch
                    id="sensitive-data-access"
                    checked={securitySettings.sensitiveDataAccess}
                    onCheckedChange={() => handleSecurityToggle("sensitiveDataAccess")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="audit-logging">Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable detailed audit logs for system actions
                    </p>
                  </div>
                  <Switch
                    id="audit-logging"
                    checked={securitySettings.auditLogging}
                    onCheckedChange={() => handleSecurityToggle("auditLogging")}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default General;
