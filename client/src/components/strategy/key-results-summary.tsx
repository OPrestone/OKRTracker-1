import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const keyResultsDistribution = [
  { range: '0-10%', count: 5 },
  { range: '10-20%', count: 2 },
  { range: '20-30%', count: 2 },
  { range: '30-40%', count: 1 },
  { range: '40-50%', count: 2 },
  { range: '50-60%', count: 3 },
  { range: '60-70%', count: 4 },
  { range: '70-80%', count: 0 },
  { range: '80-90%', count: 5 },
  { range: '90-100%', count: 1 },
];

const confidenceData = [
  { status: 'On track', count: 12, color: '#5bb498' },
  { status: 'At risk', count: 8, color: '#f0c268' },
  { status: 'Off track', count: 3, color: '#e05d5d' },
  { status: 'Pending', count: 2, color: '#9ca3af' },
];

const progressOverTime = [
  { date: '20 Feb', keyResults: 10, tasks: 5 },
  { date: '27 Feb', keyResults: 15, tasks: 8 },
  { date: '3 Mar', keyResults: 35, tasks: 25 },
  { date: '10 Mar', keyResults: 40, tasks: 30 },
  { date: '15 Mar', keyResults: 38, tasks: 35 },
  { date: '20 Mar', keyResults: 5, tasks: 38 },
  { date: '26 Mar', keyResults: 32, tasks: 65 },
];

const confidenceTrends = [
  { date: '20 Feb', onTrack: 40, atRisk: 30, offTrack: 30 },
  { date: '27 Feb', onTrack: 55, atRisk: 25, offTrack: 20 },
  { date: '3 Mar', onTrack: 60, atRisk: 30, offTrack: 10 },
  { date: '10 Mar', onTrack: 65, atRisk: 25, offTrack: 10 },
  { date: '15 Mar', onTrack: 70, atRisk: 20, offTrack: 10 },
  { date: '20 Mar', onTrack: 50, atRisk: 30, offTrack: 20 },
  { date: '26 Mar', onTrack: 70, atRisk: 10, offTrack: 20 },
];

const topKeyResults = [
  {
    id: 1,
    title: 'Drop the number of PagerDuty incidents by 35%',
    status: 'on-track',
    progress: -37,
    meta: '10 alerts/week',
    owner: { initials: 'AM', color: '#4f46e5' }
  },
  {
    id: 2,
    title: 'Grow sales team from 6 to 12 people',
    status: 'on-track',
    progress: 10,
    meta: '11 people',
    owner: { initials: 'AM', color: '#4f46e5' }
  },
  {
    id: 3,
    title: 'Achieve 99.99% uptime for key systems over the quarter',
    status: 'at-risk',
    progress: 80,
    meta: '80%',
    owner: { initials: 'JB', color: '#22c55e' }
  },
  {
    id: 4,
    title: 'Close 10 of the top 25 most valuable deals',
    status: 'on-track',
    progress: 60,
    meta: '8 tickets',
    owner: { initials: 'AM', color: '#4f46e5' }
  },
];

const bottomKeyResults = [
  {
    id: 5,
    title: 'Implement daily automated alerts for downtime detection',
    status: 'pending',
    progress: 0,
    meta: '0%',
    owner: { initials: 'JB', color: '#22c55e' }
  },
  {
    id: 6,
    title: 'Achieve a reduction of manual reporting by 80% post-integration',
    status: 'pending',
    progress: 0,
    meta: '0%',
    owner: { initials: 'SW', color: '#0ea5e9' }
  },
  {
    id: 7,
    title: 'Train 100% of key users across all divisions',
    status: 'pending',
    progress: 0,
    meta: '0%',
    owner: { initials: 'JS', color: '#8b5cf6' }
  },
];

// Function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'on-track':
      return '#5bb498';
    case 'at-risk':
      return '#f0c268';
    case 'off-track':
      return '#e05d5d';
    case 'pending':
    default:
      return '#9ca3af';
  }
};

const KeyResultSummary: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Key Result Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Key Result statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={keyResultsDistribution} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Net Confidence Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Net Confidence Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#5bb498"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - 12 / 25)}
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#f0c268"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - 8 / 25) + 2 * Math.PI * 54 * (12 / 25)}
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e05d5d"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - 3 / 25) + 2 * Math.PI * 54 * (20 / 25)}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-700">36</div>
                  <div className="text-xs text-gray-500">NCS</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 w-full max-w-[180px]">
              {confidenceData.map((item, index) => (
                <div key={index} className="flex items-center text-xs">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="mr-1">{item.count}</span>
                  <span className="text-gray-500">{item.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Result Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Key Result progress</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px]">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - 0.44)}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-bold text-gray-700">44%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Results vs. Tasks Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Key Results vs. Tasks progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressOverTime} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="keyResults" stroke="#06b6d4" name="Key Results progress" />
                <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" name="Tasks progress" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Confidence trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={confidenceTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="onTrack" stackId="1" stroke="#5bb498" fill="#5bb498" />
                <Area type="monotone" dataKey="atRisk" stackId="1" stroke="#f0c268" fill="#f0c268" />
                <Area type="monotone" dataKey="offTrack" stackId="1" stroke="#e05d5d" fill="#e05d5d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8">Key Result details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Progress Key Results */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Top progress key results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topKeyResults.map((kr) => (
                <div key={kr.id} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                    <div 
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: getStatusColor(kr.status) }}
                    ></div>
                  </div>
                  
                  <div className="flex-grow px-2">
                    <div className="text-sm mb-1">{kr.title}</div>
                    <div className="text-xs text-gray-500">{kr.meta}</div>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <div className={`font-medium text-sm mr-4 ${kr.progress < 0 ? 'text-green-600' : kr.progress > 80 ? 'text-amber-600' : 'text-blue-600'}`}>
                      {kr.progress < 0 ? '' : '+'}{kr.progress}%
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: kr.owner.color }}
                    >
                      {kr.owner.initials}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Progress Key Results */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Bottom progress key results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bottomKeyResults.map((kr) => (
                <div key={kr.id} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                    <div 
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: getStatusColor(kr.status) }}
                    ></div>
                  </div>
                  
                  <div className="flex-grow px-2">
                    <div className="text-sm mb-1">{kr.title}</div>
                    <div className="text-xs text-gray-500">{kr.meta}</div>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <div className="font-medium text-sm mr-4 text-amber-600">
                      {kr.progress}%
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: kr.owner.color }}
                    >
                      {kr.owner.initials}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KeyResultSummary;