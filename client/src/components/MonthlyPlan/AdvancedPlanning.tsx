import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MonthlyPlan } from '@/redux/slices/monthlyPlanSlice';
import { 
  RefreshCw, 
  Save, 
  Grid3X3, 
  AlertTriangle, 
  Clock,
  Copy,
  Trash2,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedPlanningProps {
  plans: MonthlyPlan[];
  onCreatePlan?: (planData: Partial<MonthlyPlan>) => void;
}

interface RecurringPlan {
  id: string;
  name: string;
  subject: string;
  target: string;
  targetType: string;
  targetAmount: number;
  priority: string;
  frequency: 'monthly' | 'weekly' | 'quarterly';
  isActive: boolean;
  nextGeneration: string;
}

interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  plans: Array<{
    subject: string;
    target: string;
    targetType: 'chapters' | 'hours' | 'topics' | 'pages';
    targetAmount: number;
    priority: 'High' | 'Medium' | 'Low';
    estimatedDays: number;
  }>;
  totalWorkload: number;
  usageCount: number;
  createdAt: string;
}

const AdvancedPlanning: React.FC<AdvancedPlanningProps> = ({ 
  plans, 
  onCreatePlan 
}) => {
  const [recurringPlans, setRecurringPlans] = useState<RecurringPlan[]>([]);

  const [templates, setTemplates] = useState<PlanTemplate[]>([]);

  // Generate templates dynamically from user's actual plan patterns
  useEffect(() => {
    if (plans.length > 0) {
      const subjectGroups = plans.reduce((groups, plan) => {
        if (!groups[plan.subject]) {
          groups[plan.subject] = [];
        }
        groups[plan.subject].push(plan);
        return groups;
      }, {} as Record<string, MonthlyPlan[]>);

      const dynamicTemplates: PlanTemplate[] = [];

      // Create template from most common subjects
      const sortedSubjects = Object.entries(subjectGroups)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 4);

      if (sortedSubjects.length >= 2) {
        const templatePlans = sortedSubjects.map(([subject, subjectPlans]) => {
          const avgAmount = Math.round(
            subjectPlans.reduce((sum, p) => sum + p.targetAmount, 0) / subjectPlans.length
          );
          const commonType = subjectPlans[0].targetType;
          const commonPriority = subjectPlans[0].priority || 'Medium';
          
          return {
            subject,
            target: `${subject} study plan`,
            targetType: commonType,
            targetAmount: avgAmount,
            priority: commonPriority,
            estimatedDays: Math.ceil(avgAmount * (commonType === 'hours' ? 1 : commonType === 'chapters' ? 3 : 2) / 8)
          };
        });

        dynamicTemplates.push({
          id: '1',
          name: 'Your Study Pattern',
          description: `Based on your most studied subjects`,
          plans: templatePlans,
          totalWorkload: templatePlans.reduce((sum, p) => sum + p.estimatedDays, 0),
          usageCount: 0,
          createdAt: new Date().toISOString().split('T')[0]
        });
      }

      // Create high-priority template
      const highPriorityPlans = plans.filter(p => p.priority === 'High');
      if (highPriorityPlans.length >= 2) {
        const priorityTemplate = highPriorityPlans.slice(0, 3).map(plan => ({
          subject: plan.subject,
          target: `Priority: ${plan.target}`,
          targetType: plan.targetType || 'chapters',
          targetAmount: plan.targetAmount,
          priority: 'High' as const,
          estimatedDays: Math.ceil(plan.targetAmount * (plan.targetType === 'hours' ? 1 : plan.targetType === 'chapters' ? 3 : 2) / 8)
        }));

        dynamicTemplates.push({
          id: '2',
          name: 'High Priority Focus',
          description: 'Template based on your high-priority plans',
          plans: priorityTemplate,
          totalWorkload: priorityTemplate.reduce((sum, p) => sum + p.estimatedDays, 0),
          usageCount: 0,
          createdAt: new Date().toISOString().split('T')[0]
        });
      }

      setTemplates(dynamicTemplates);
    }
  }, [plans]);

  const [newRecurringPlan, setNewRecurringPlan] = useState<{
    name: string;
    subject: string;
    target: string;
    targetType: string;
    targetAmount: number;
    priority: string;
    frequency: 'monthly' | 'weekly' | 'quarterly';
  }>({
    name: '',
    subject: '',
    target: '',
    targetType: 'chapters',
    targetAmount: 1,
    priority: 'Medium',
    frequency: 'monthly'
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    plans: [] as PlanTemplate['plans']
  });

  // Priority Matrix Data
  const priorityMatrix = {
    urgent_important: plans.filter(p => p.priority === 'High'),
    not_urgent_important: plans.filter(p => p.priority === 'Medium'),
    urgent_not_important: [],
    not_urgent_not_important: plans.filter(p => p.priority === 'Low')
  };

  // Study Load Analysis
  const calculateWorkload = () => {
    const totalHours = plans.reduce((sum, plan) => {
      const multiplier = plan.targetType === 'hours' ? 1 : 
                       plan.targetType === 'chapters' ? 3 : 
                       plan.targetType === 'topics' ? 2 : 1;
      return sum + (plan.targetAmount * multiplier);
    }, 0);

    const workingDays = 30; // Assuming 30 days in a month
    const dailyHours = totalHours / workingDays;
    
    return {
      totalHours,
      dailyHours,
      workloadLevel: dailyHours > 8 ? 'overloaded' : 
                    dailyHours > 6 ? 'heavy' : 
                    dailyHours > 4 ? 'moderate' : 'light',
      recommendation: dailyHours > 8 ? 'Consider reducing targets or extending timeline' :
                     dailyHours > 6 ? 'Intensive but manageable schedule' :
                     'Good workload balance'
    };
  };

  const workloadAnalysis = calculateWorkload();

  // Buffer Time Calculations
  const calculateBufferTime = (plan: MonthlyPlan) => {
    const baseTime = plan.targetAmount * (plan.targetType === 'chapters' ? 3 : 
                                         plan.targetType === 'topics' ? 2 : 1);
    const complexityMultiplier = plan.priority === 'High' ? 1.3 : 
                               plan.priority === 'Medium' ? 1.2 : 1.1;
    const bufferTime = baseTime * complexityMultiplier * 0.2; // 20% buffer
    const suggestedDays = Math.ceil(bufferTime / 8); // 8 hours per day
    
    return {
      baseTime,
      bufferTime,
      suggestedDays,
      recommendation: `Add ${suggestedDays} buffer days for ${plan.subject}`
    };
  };

  const handleCreateRecurring = () => {
    const newPlan: RecurringPlan = {
      id: Date.now().toString(),
      ...newRecurringPlan,
      isActive: true,
      nextGeneration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    setRecurringPlans([...recurringPlans, newPlan]);
    setNewRecurringPlan({
      name: '',
      subject: '',
      target: '',
      targetType: 'chapters',
      targetAmount: 1,
      priority: 'Medium',
      frequency: 'monthly'
    });
  };

  const handleApplyTemplate = (template: PlanTemplate) => {
    template.plans.forEach(planData => {
      if (onCreatePlan) {
        onCreatePlan({
          ...planData,
          deadline: new Date(Date.now() + planData.estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    });
  };

  const getWorkloadColor = (level: string) => {
    switch (level) {
      case 'overloaded': return 'text-red-600 bg-red-100';
      case 'heavy': return 'text-orange-600 bg-orange-100';
      case 'moderate': return 'text-green-600 bg-green-100';
      case 'light': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-red-500 bg-red-50';
      case 'Medium': return 'border-yellow-500 bg-yellow-50';
      case 'Low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="recurring" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recurring">Recurring Plans</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="priority">Priority Matrix</TabsTrigger>
        </TabsList>

        {/* Recurring Plans */}
        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Recurring Plans
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recurring Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Recurring Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Plan Name</Label>
                        <Input
                          id="name"
                          value={newRecurringPlan.name}
                          onChange={(e) => setNewRecurringPlan({...newRecurringPlan, name: e.target.value})}
                          placeholder="e.g., Monthly History Revision"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={newRecurringPlan.subject}
                            onChange={(e) => setNewRecurringPlan({...newRecurringPlan, subject: e.target.value})}
                            placeholder="Subject"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="frequency">Frequency</Label>
                          <Select
                            value={newRecurringPlan.frequency}
                            onValueChange={(value: 'monthly' | 'weekly' | 'quarterly') =>
                              setNewRecurringPlan({...newRecurringPlan, frequency: value})
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target">Target Description</Label>
                        <Input
                          id="target"
                          value={newRecurringPlan.target}
                          onChange={(e) => setNewRecurringPlan({...newRecurringPlan, target: e.target.value})}
                          placeholder="What needs to be accomplished"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="targetType">Type</Label>
                          <Select
                            value={newRecurringPlan.targetType}
                            onValueChange={(value) => setNewRecurringPlan({...newRecurringPlan, targetType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chapters">Chapters</SelectItem>
                              <SelectItem value="pages">Pages</SelectItem>
                              <SelectItem value="topics">Topics</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={newRecurringPlan.targetAmount}
                            onChange={(e) => setNewRecurringPlan({...newRecurringPlan, targetAmount: parseInt(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={newRecurringPlan.priority}
                            onValueChange={(value) => setNewRecurringPlan({...newRecurringPlan, priority: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={handleCreateRecurring} className="w-full">
                        Create Recurring Plan
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recurringPlans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{plan.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{plan.frequency}</Badge>
                        <Switch checked={plan.isActive} />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><span className="font-medium">{plan.subject}:</span> {plan.target}</p>
                      <p><span className="font-medium">Target:</span> {plan.targetAmount} {plan.targetType}</p>
                      <p><span className="font-medium">Next Generation:</span> {plan.nextGeneration}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge className={getPriorityColor(plan.priority)}>
                        {plan.priority} Priority
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Plan Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="secondary">{template.usageCount} uses</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="text-xs font-medium">Includes {template.plans.length} plans:</div>
                      {template.plans.slice(0, 3).map((plan, index) => (
                        <div key={index} className="text-xs bg-gray-50 rounded p-2">
                          <span className="font-medium">{plan.subject}:</span> {plan.targetAmount} {plan.targetType}
                        </div>
                      ))}
                      {template.plans.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{template.plans.length - 3} more plans
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {template.totalWorkload} days workload
                      </div>
                      <Button size="sm" onClick={() => handleApplyTemplate(template)}>
                        Apply Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Priority Matrix */}
        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Eisenhower Priority Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 h-96">
                {/* Urgent & Important */}
                <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
                  <h3 className="font-bold text-red-700 mb-3">Urgent & Important</h3>
                  <div className="space-y-2">
                    {priorityMatrix.urgent_important.map((plan) => (
                      <div key={plan.id} className="bg-white p-2 rounded text-sm">
                        <div className="font-medium">{plan.subject}</div>
                        <div className="text-xs text-gray-600">{plan.target}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Not Urgent & Important */}
                <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                  <h3 className="font-bold text-green-700 mb-3">Not Urgent & Important</h3>
                  <div className="space-y-2">
                    {priorityMatrix.not_urgent_important.map((plan) => (
                      <div key={plan.id} className="bg-white p-2 rounded text-sm">
                        <div className="font-medium">{plan.subject}</div>
                        <div className="text-xs text-gray-600">{plan.target}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Urgent & Not Important */}
                <div className="border-2 border-yellow-500 rounded-lg p-4 bg-yellow-50">
                  <h3 className="font-bold text-yellow-700 mb-3">Urgent & Not Important</h3>
                  <div className="text-sm text-gray-500">No plans in this category</div>
                </div>

                {/* Not Urgent & Not Important */}
                <div className="border-2 border-gray-500 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold text-gray-700 mb-3">Not Urgent & Not Important</h3>
                  <div className="space-y-2">
                    {priorityMatrix.not_urgent_not_important.map((plan) => (
                      <div key={plan.id} className="bg-white p-2 rounded text-sm">
                        <div className="font-medium">{plan.subject}</div>
                        <div className="text-xs text-gray-600">{plan.target}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Buffer Time Calculations */}
        <TabsContent value="buffer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Buffer Time Calculations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => {
                  const bufferAnalysis = calculateBufferTime(plan);
                  
                  return (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{plan.subject}</h4>
                        <Badge className={getPriorityColor(plan.priority || 'Medium')}>
                          {plan.priority} Priority
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">{plan.target}</div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-blue-600">{bufferAnalysis.baseTime}h</div>
                          <div className="text-muted-foreground">Base Time</div>
                        </div>
                        <div>
                          <div className="font-medium text-orange-600">{bufferAnalysis.bufferTime.toFixed(1)}h</div>
                          <div className="text-muted-foreground">Buffer Time</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">{bufferAnalysis.suggestedDays}</div>
                          <div className="text-muted-foreground">Buffer Days</div>
                        </div>
                        <div>
                          <div className="font-medium text-purple-600">{plan.targetAmount}</div>
                          <div className="text-muted-foreground">{plan.targetType}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                        <strong>💡 Suggestion:</strong> {bufferAnalysis.recommendation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedPlanning;
