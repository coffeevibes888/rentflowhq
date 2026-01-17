'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Plus, Trash2, GripVertical, Eye } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ResumeData {
  personalInfo: {
    name: string;
    location: string;
    email: string;
    phone: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    school: string;
    location: string;
    years: string;
    details: string[];
  }>;
  skills: string[];
  certifications: string[];
}

const defaultResume: ResumeData = {
  personalInfo: {
    name: 'Gregory Young',
    location: 'Littleton, CO 80123',
    email: 'coffeevibes888@gmail.com',
    phone: '(478) 335-7618',
  },
  summary: 'Versatile and dynamic leader with 10+ years of diverse experience in property management, business operations, team leadership, and customer service. Proven success in supervising teams, resolving complex problems, and delivering high-quality results across real estate, tech, service, and entrepreneurial sectors.',
  experience: [
    {
      id: '1',
      title: 'Manager',
      company: 'Application Tech',
      location: 'Las Vegas, NV',
      startDate: 'Jan 2020',
      endDate: 'Present',
      current: true,
      bullets: [
        'Supervised cross-functional tech and service teams to ensure project timelines and quality standards were met',
        'Trained and evaluated team members, improving productivity and workflow consistency',
        'Implemented streamlined scheduling and ticketing system, reducing response time by 25%',
      ],
    },
    {
      id: '2',
      title: 'Property Manager / Supervisor',
      company: 'AAA Real Estate',
      location: 'Buffalo, NY',
      startDate: 'Jun 2016',
      endDate: 'Dec 2019',
      current: false,
      bullets: [
        'Managed 25+ rental units, overseeing tenant relations, maintenance coordination, and leasing processes',
        'Supervised maintenance crews and administrative staff',
        'Reduced vacancy rate by 35% through strategic marketing and customer retention',
      ],
    },
  ],
  education: [
    {
      id: '1',
      degree: 'Leadership & Business Development Program',
      school: 'Peak Potentials / Success Resources',
      location: 'California Valley, CA',
      years: '2016 - 2024',
      details: [
        'Graduate of Enlightened Warrior Training Camp (Leadership & Emotional Mastery)',
        'Train the Trainer (Public Speaking & Influence)',
        'Guerrilla Business School (Entrepreneurship, Sales, and Team Leadership)',
      ],
    },
  ],
  skills: [
    'Team Leadership & Supervision',
    'Property Management',
    'Customer Service Excellence',
    'Business Operations',
    'Conflict Resolution',
    'Sales & Upselling',
  ],
  certifications: ['Valid Driver\'s License', 'Property Management Experience'],
};

export default function ResumeBuilderClient() {
  const [resume, setResume] = useState<ResumeData>(defaultResume);
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');
  const [preview, setPreview] = useState(false);

  const addExperience = () => {
    setResume({
      ...resume,
      experience: [
        ...resume.experience,
        {
          id: Date.now().toString(),
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          bullets: [''],
        },
      ],
    });
  };

  const removeExperience = (id: string) => {
    setResume({
      ...resume,
      experience: resume.experience.filter((exp) => exp.id !== id),
    });
  };

  const updateExperience = (id: string, field: string, value: any) => {
    setResume({
      ...resume,
      experience: resume.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const addBullet = (expId: string) => {
    setResume({
      ...resume,
      experience: resume.experience.map((exp) =>
        exp.id === expId ? { ...exp, bullets: [...exp.bullets, ''] } : exp
      ),
    });
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    setResume({
      ...resume,
      experience: resume.experience.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              bullets: exp.bullets.map((b, i) => (i === bulletIndex ? value : b)),
            }
          : exp
      ),
    });
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    setResume({
      ...resume,
      experience: resume.experience.map((exp) =>
        exp.id === expId
          ? { ...exp, bullets: exp.bullets.filter((_, i) => i !== bulletIndex) }
          : exp
      ),
    });
  };

  const downloadPDF = async () => {
    const response = await fetch('/api/super-admin/resume/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, template }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.personalInfo.name.replace(/\s+/g, '_')}_Resume.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Resume Builder</h1>
            <p className="text-slate-300">Create and customize your professional resume</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setPreview(!preview)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              {preview ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={downloadPDF} className="bg-violet-600 hover:bg-violet-700">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {!preview ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-6">
              {/* Personal Info */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Full Name</Label>
                    <Input
                      value={resume.personalInfo.name}
                      onChange={(e) =>
                        setResume({
                          ...resume,
                          personalInfo: { ...resume.personalInfo, name: e.target.value },
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        value={resume.personalInfo.email}
                        onChange={(e) =>
                          setResume({
                            ...resume,
                            personalInfo: { ...resume.personalInfo, email: e.target.value },
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Phone</Label>
                      <Input
                        value={resume.personalInfo.phone}
                        onChange={(e) =>
                          setResume({
                            ...resume,
                            personalInfo: { ...resume.personalInfo, phone: e.target.value },
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Location</Label>
                    <Input
                      value={resume.personalInfo.location}
                      onChange={(e) =>
                        setResume({
                          ...resume,
                          personalInfo: { ...resume.personalInfo, location: e.target.value },
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Professional Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={resume.summary}
                    onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                    rows={4}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </CardContent>
              </Card>

              {/* Experience */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Experience</CardTitle>
                    <Button
                      onClick={addExperience}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {resume.experience.map((exp, index) => (
                    <div key={exp.id} className="border border-white/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Position {index + 1}</span>
                        <Button
                          onClick={() => removeExperience(exp.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-slate-300 text-xs">Job Title</Label>
                          <Input
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300 text-xs">Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-slate-300 text-xs">Start Date</Label>
                          <Input
                            value={exp.startDate}
                            onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                            placeholder="Jan 2020"
                            className="bg-white/5 border-white/10 text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300 text-xs">End Date</Label>
                          <Input
                            value={exp.endDate}
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            placeholder="Present"
                            disabled={exp.current}
                            className="bg-white/5 border-white/10 text-white text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => {
                                updateExperience(exp.id, 'current', e.target.checked);
                                if (e.target.checked) {
                                  updateExperience(exp.id, 'endDate', 'Present');
                                }
                              }}
                              className="rounded"
                            />
                            Current
                          </label>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">Location</Label>
                        <Input
                          value={exp.location}
                          onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-sm"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-slate-300 text-xs">Achievements</Label>
                          <Button
                            onClick={() => addBullet(exp.id)}
                            size="sm"
                            variant="ghost"
                            className="text-violet-400 hover:text-violet-300 h-6 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        {exp.bullets.map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className="flex gap-2 mb-2">
                            <Textarea
                              value={bullet}
                              onChange={(e) => updateBullet(exp.id, bulletIndex, e.target.value)}
                              rows={2}
                              className="bg-white/5 border-white/10 text-white text-sm"
                            />
                            <Button
                              onClick={() => removeBullet(exp.id, bulletIndex)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Template Selection & Preview */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Template Style</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {(['modern', 'classic', 'minimal'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTemplate(t)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          template === t
                            ? 'border-violet-500 bg-violet-500/20'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                      >
                        <div className="text-white font-medium capitalize">{t}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-8 rounded-lg shadow-2xl min-h-[600px]">
                    <ResumePreview resume={resume} template={template} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-8">
              <div className="bg-white p-12 rounded-lg shadow-2xl max-w-4xl mx-auto">
                <ResumePreview resume={resume} template={template} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ResumePreview({ resume, template }: { resume: ResumeData; template: string }) {
  if (template === 'modern') {
    return (
      <div className="space-y-6">
        <div className="border-b-4 border-violet-600 pb-4">
          <h1 className="text-4xl font-bold text-slate-900">{resume.personalInfo.name}</h1>
          <div className="flex gap-4 text-sm text-slate-600 mt-2">
            <span>{resume.personalInfo.location}</span>
            <span>•</span>
            <span>{resume.personalInfo.email}</span>
            <span>•</span>
            <span>{resume.personalInfo.phone}</span>
          </div>
        </div>

        {resume.summary && (
          <div>
            <h2 className="text-xl font-bold text-violet-600 mb-2">PROFESSIONAL SUMMARY</h2>
            <p className="text-slate-700 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {resume.experience.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-violet-600 mb-3">EXPERIENCE</h2>
            <div className="space-y-4">
              {resume.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">{exp.title}</h3>
                      <p className="text-slate-700">{exp.company} - {exp.location}</p>
                    </div>
                    <span className="text-sm text-slate-600 whitespace-nowrap">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {exp.bullets.map((bullet, i) => (
                      <li key={i} className="text-slate-700 text-sm">{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.education.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-violet-600 mb-3">EDUCATION & TRAINING</h2>
            <div className="space-y-3">
              {resume.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between">
                    <h3 className="font-bold text-slate-900">{edu.degree}</h3>
                    <span className="text-sm text-slate-600">{edu.years}</span>
                  </div>
                  <p className="text-slate-700">{edu.school} - {edu.location}</p>
                  {edu.details.length > 0 && (
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {edu.details.map((detail, i) => (
                        <li key={i} className="text-slate-700 text-sm">{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.skills.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-violet-600 mb-2">KEY SKILLS</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, i) => (
                <span key={i} className="bg-violet-100 text-violet-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div className="text-slate-600">Select a template to preview</div>;
}
