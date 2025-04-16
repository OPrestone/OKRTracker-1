import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Link,
  PlugZap,
  Globe,
  Database,
  Shield,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Mail,
  MessageSquare,
  Calendar
} from "lucide-react";
// Brand icons for specific services
import { 
  SiSlack, 
  SiJira, 
  SiAsana, 
  SiGitlab, 
  SiGithub, 
  SiMicrosoft, 
  SiGoogle 
} from "react-icons/si";

const IntegrationCard = ({
  title,
  description,
  icon,
  isConnected = false,
  onConnect,
  onDisconnect
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isConnected?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-md">
              {icon}
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
          {isConnected ? (
            <div className="flex items-center text-sm text-green-600">
              <Check className="h-4 w-4 mr-1" />
              Connected
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <X className="h-4 w-4 mr-1" />
              Not Connected
            </div>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        {isConnected ? (
          <Button variant="outline" onClick={onDisconnect} className="w-full">
            Disconnect
          </Button>
        ) : (
          <Button onClick={onConnect} className="w-full">
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const Integrations = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("thirdparty");
  
  // API Keys
  const [apiKeyEnabled, setApiKeyEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  // Single Sign-On
  const [microsoftSsoEnabled, setMicrosoftSsoEnabled] = useState(false);
  const [googleSsoEnabled, setGoogleSsoEnabled] = useState(false);
  
  // Third-party integrations
  const [integrations, setIntegrations] = useState({
    slack: false,
    jira: false,
    asana: false,
    gitlab: false,
    github: false,
    outlook: false,
    gcalendar: false
  });
  
  // LDAP settings
  const [ldapEnabled, setLdapEnabled] = useState(false);
  const [ldapSettings, setLdapSettings] = useState({
    server: "",
    port: "389",
    bindDn: "",
    bindPassword: "",
    searchBase: "",
    userFilter: "(objectClass=person)"
  });
  
  // Connect/disconnect integration
  const handleToggleIntegration = (key: keyof typeof integrations) => {
    if (integrations[key]) {
      // Disconnect
      setIntegrations({
        ...integrations,
        [key]: false
      });
      toast({
        title: "Integration disconnected",
        description: `The integration with ${key.charAt(0).toUpperCase() + key.slice(1)} has been disconnected.`
      });
    } else {
      // Connect
      setIntegrations({
        ...integrations,
        [key]: true
      });
      toast({
        title: "Integration connected",
        description: `Successfully connected with ${key.charAt(0).toUpperCase() + key.slice(1)}.`
      });
    }
  };
  
  // Generate new API key
  const handleGenerateApiKey = () => {
    // In a real application, this would be a server call
    const newKey = Array(32)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join("");
    
    setApiKey(newKey);
    setApiKeyEnabled(true);
    
    toast({
      title: "API Key Generated",
      description: "Your new API key has been generated. Keep it secure!"
    });
  };
  
  // Save LDAP settings
  const handleSaveLdapSettings = () => {
    toast({
      title: "LDAP Settings Saved",
      description: "Your LDAP authentication settings have been updated."
    });
  };
  
  // Toggle SSO providers
  const handleToggleSso = (provider: "microsoft" | "google") => {
    if (provider === "microsoft") {
      setMicrosoftSsoEnabled(!microsoftSsoEnabled);
      toast({
        title: microsoftSsoEnabled ? "Microsoft SSO Disabled" : "Microsoft SSO Enabled",
        description: microsoftSsoEnabled 
          ? "Microsoft single sign-on has been disabled." 
          : "Microsoft single sign-on has been enabled."
      });
    } else {
      setGoogleSsoEnabled(!googleSsoEnabled);
      toast({
        title: googleSsoEnabled ? "Google SSO Disabled" : "Google SSO Enabled",
        description: googleSsoEnabled 
          ? "Google single sign-on has been disabled." 
          : "Google single sign-on has been enabled."
      });
    }
  };

  return (
    <DashboardLayout title="Integrations">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600">Connect with third-party services and manage API access</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="thirdparty" className="flex items-center gap-2">
            <PlugZap className="h-4 w-4" />
            <span className="hidden md:inline">Third-Party Apps</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">API Access</span>
          </TabsTrigger>
          <TabsTrigger value="sso" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Single Sign-On</span>
          </TabsTrigger>
          <TabsTrigger value="ldap" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden md:inline">LDAP</span>
          </TabsTrigger>
        </TabsList>

        {/* Third-Party Apps Tab */}
        <TabsContent value="thirdparty">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <IntegrationCard
              title="Slack"
              description="Receive OKR updates and notifications in your Slack channels"
              icon={<SiSlack className="h-6 w-6 text-[#4A154B]" />}
              isConnected={integrations.slack}
              onConnect={() => handleToggleIntegration("slack")}
              onDisconnect={() => handleToggleIntegration("slack")}
            />
            
            <IntegrationCard
              title="Jira"
              description="Link Jira issues to key results and track progress"
              icon={<SiJira className="h-6 w-6 text-[#0052CC]" />}
              isConnected={integrations.jira}
              onConnect={() => handleToggleIntegration("jira")}
              onDisconnect={() => handleToggleIntegration("jira")}
            />
            
            <IntegrationCard
              title="Asana"
              description="Sync Asana tasks with OKR initiatives and key results"
              icon={<SiAsana className="h-6 w-6 text-[#F06A6A]" />}
              isConnected={integrations.asana}
              onConnect={() => handleToggleIntegration("asana")}
              onDisconnect={() => handleToggleIntegration("asana")}
            />
            
            <IntegrationCard
              title="GitLab"
              description="Connect GitLab issues and merge requests to key results"
              icon={<SiGitlab className="h-6 w-6 text-[#FC6D26]" />}
              isConnected={integrations.gitlab}
              onConnect={() => handleToggleIntegration("gitlab")}
              onDisconnect={() => handleToggleIntegration("gitlab")}
            />
            
            <IntegrationCard
              title="GitHub"
              description="Link GitHub issues and pull requests to key results"
              icon={<SiGithub className="h-6 w-6 text-[#24292F]" />}
              isConnected={integrations.github}
              onConnect={() => handleToggleIntegration("github")}
              onDisconnect={() => handleToggleIntegration("github")}
            />
            
            <IntegrationCard
              title="Microsoft Outlook"
              description="Schedule check-ins and meetings with Outlook Calendar"
              icon={<SiMicrosoftoutlook className="h-6 w-6 text-[#0078D4]" />}
              isConnected={integrations.outlook}
              onConnect={() => handleToggleIntegration("outlook")}
              onDisconnect={() => handleToggleIntegration("outlook")}
            />
            
            <IntegrationCard
              title="Google Calendar"
              description="Sync OKR events with Google Calendar"
              icon={<SiGooglecalendar className="h-6 w-6 text-[#4285F4]" />}
              isConnected={integrations.gcalendar}
              onConnect={() => handleToggleIntegration("gcalendar")}
              onDisconnect={() => handleToggleIntegration("gcalendar")}
            />
          </div>
        </TabsContent>

        {/* API Access Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to the OKR system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Enable API Access</h3>
                  <p className="text-sm text-gray-500">
                    Allow external applications to access the OKR system via API
                  </p>
                </div>
                <Switch 
                  checked={apiKeyEnabled} 
                  onCheckedChange={setApiKeyEnabled} 
                />
              </div>
              
              {apiKeyEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">Your API Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="api-key" 
                        value={apiKey} 
                        readOnly 
                        type="password"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (apiKey) {
                            navigator.clipboard.writeText(apiKey);
                            toast({
                              title: "API Key Copied",
                              description: "The API key has been copied to your clipboard."
                            });
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleGenerateApiKey} className="flex-1">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {apiKey ? "Regenerate API Key" : "Generate API Key"}
                    </Button>
                  </div>
                  
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Treat your API key like a password. Never share it publicly or commit it to source control.
                      Regenerating your API key will invalidate your previous key.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Single Sign-On Tab */}
        <TabsContent value="sso">
          <Card>
            <CardHeader>
              <CardTitle>Single Sign-On (SSO)</CardTitle>
              <CardDescription>
                Configure SSO options to allow users to log in with their existing corporate accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-md">
                      <Mail className="h-6 w-6 text-[#0078D4]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Microsoft 365</h3>
                      <p className="text-sm text-gray-500">
                        Enable sign-in with Microsoft accounts
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={microsoftSsoEnabled} 
                    onCheckedChange={() => handleToggleSso("microsoft")} 
                  />
                </div>
                
                {microsoftSsoEnabled && (
                  <div className="space-y-4 pt-4 pl-12">
                    <div className="space-y-2">
                      <Label htmlFor="ms-tenant-id">Tenant ID</Label>
                      <Input 
                        id="ms-tenant-id" 
                        placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ms-client-id">Client ID</Label>
                      <Input 
                        id="ms-client-id" 
                        placeholder="e.g., 87654321-4321-4321-4321-210987654321"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ms-client-secret">Client Secret</Label>
                      <Input 
                        id="ms-client-secret" 
                        type="password" 
                        placeholder="Enter client secret"
                      />
                    </div>
                    <Button>Save Microsoft SSO Settings</Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-md">
                      <Calendar className="h-6 w-6 text-[#4285F4]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Google Workspace</h3>
                      <p className="text-sm text-gray-500">
                        Enable sign-in with Google accounts
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={googleSsoEnabled} 
                    onCheckedChange={() => handleToggleSso("google")} 
                  />
                </div>
                
                {googleSsoEnabled && (
                  <div className="space-y-4 pt-4 pl-12">
                    <div className="space-y-2">
                      <Label htmlFor="google-client-id">Client ID</Label>
                      <Input 
                        id="google-client-id" 
                        placeholder="e.g., 123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="google-client-secret">Client Secret</Label>
                      <Input 
                        id="google-client-secret" 
                        type="password" 
                        placeholder="Enter client secret"
                      />
                    </div>
                    <Button>Save Google SSO Settings</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LDAP Tab */}
        <TabsContent value="ldap">
          <Card>
            <CardHeader>
              <CardTitle>LDAP Authentication</CardTitle>
              <CardDescription>
                Configure LDAP for authenticating users against your directory server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Enable LDAP Authentication</h3>
                  <p className="text-sm text-gray-500">
                    Allow users to sign in using LDAP credentials
                  </p>
                </div>
                <Switch 
                  checked={ldapEnabled} 
                  onCheckedChange={setLdapEnabled} 
                />
              </div>
              
              {ldapEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ldap-server">LDAP Server</Label>
                      <Input 
                        id="ldap-server" 
                        placeholder="ldap.example.com"
                        value={ldapSettings.server}
                        onChange={(e) => setLdapSettings({...ldapSettings, server: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ldap-port">LDAP Port</Label>
                      <Input 
                        id="ldap-port" 
                        placeholder="389"
                        value={ldapSettings.port}
                        onChange={(e) => setLdapSettings({...ldapSettings, port: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bind-dn">Bind DN</Label>
                    <Input 
                      id="bind-dn" 
                      placeholder="cn=admin,dc=example,dc=com"
                      value={ldapSettings.bindDn}
                      onChange={(e) => setLdapSettings({...ldapSettings, bindDn: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bind-password">Bind Password</Label>
                    <Input 
                      id="bind-password" 
                      type="password" 
                      placeholder="Enter bind password"
                      value={ldapSettings.bindPassword}
                      onChange={(e) => setLdapSettings({...ldapSettings, bindPassword: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search-base">Search Base</Label>
                    <Input 
                      id="search-base" 
                      placeholder="dc=example,dc=com"
                      value={ldapSettings.searchBase}
                      onChange={(e) => setLdapSettings({...ldapSettings, searchBase: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user-filter">User Filter</Label>
                    <Input 
                      id="user-filter" 
                      placeholder="(objectClass=person)"
                      value={ldapSettings.userFilter}
                      onChange={(e) => setLdapSettings({...ldapSettings, userFilter: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleSaveLdapSettings} className="flex-1">
                      Save LDAP Settings
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Test Connection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Integrations;
