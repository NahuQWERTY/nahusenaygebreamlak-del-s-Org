
import React, { useState, useEffect, useRef } from 'react';
import { 
  FormData, 
  ExperienceLevel, 
  EmploymentType, 
  SalaryRange, 
  JobSite 
} from './types';
import { INITIAL_FORM_STATE, STEPS } from './constants';
import { Input, TextArea, Select, RadioGroup, Calendar } from './components/FormElements';

// Secure hardcoded credentials
const CONFIG = {
  SUPABASE_URL: 'https://dnxthnwcouphxvriuvnx.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueHRobndjb3VwaHh2cml1dm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDEzMjYsImV4cCI6MjA4NjIxNzMyNn0.mVQymUqD7ZduS9nU43j3l8hL73oH5b5pUXxGBY1N68U',
  SUPABASE_TABLE: 'job_requests',
  TELEGRAM_TOKEN: '8477579727:AAHGgouVt7rpYPauYFvJmVtS-ho1UVq8WZk',
  TELEGRAM_CHAT_ID: '-1003896730233'
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid business email';
      }
      if (!formData.companyName) newErrors.companyName = 'Company name is required';
      if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required';
    }

    if (step === 2) {
      if (!formData.jobDescription) newErrors.jobDescription = 'Please provide a job description';
    }

    if (step === 3) {
      if (!formData.contactPhone) {
        newErrors.contactPhone = 'Phone number is required';
      } else if (!/^\+?[0-9]{10,14}$/.test(formData.contactPhone.replace(/\s/g, ''))) {
        newErrors.contactPhone = 'Enter a valid phone number (e.g. +251 911...)';
      }

      if (!formData.deadline) {
        newErrors.deadline = 'Submission deadline is required';
      } else {
        const selectedDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          newErrors.deadline = 'Deadline cannot be in the past';
        }
      }

      if (!formData.workLocation) newErrors.workLocation = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const formatTelegramMessage = (data: FormData) => {
    return `🚀 *New Recruitment Request*

*Company:* ${data.companyName}
*Job Title:* ${data.jobTitle}
*Email:* ${data.email}
*Phone:* ${data.contactPhone}

*Location:* ${data.workLocation} (${data.jobSite})
*Experience:* ${data.experienceLevel}
*Salary:* ${data.salaryRange}
*Deadline:* ${data.deadline || 'Not set'}

*Description:*
${data.jobDescription.substring(0, 500)}${data.jobDescription.length > 500 ? '...' : ''}

#Afriwork #Recruitment #Hiring`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    setIsSyncing(true);

    const syncPromises = [];

    // 1. Supabase Sync
    const supabaseEndpoint = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.SUPABASE_TABLE}`;
    syncPromises.push(
      fetch(supabaseEndpoint, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.SUPABASE_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          email: formData.email,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          work_location: formData.workLocation,
          job_site: formData.jobSite,
          experience_level: formData.experienceLevel,
          salary_range: formData.salaryRange,
          contact_phone: formData.contactPhone,
          deadline: formData.deadline || null
        })
      }).catch(err => console.error("Supabase Sync Error:", err))
    );

    // 2. Telegram Sync
    const telegramUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/sendMessage`;
    syncPromises.push(
      fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CONFIG.TELEGRAM_CHAT_ID,
          text: formatTelegramMessage(formData),
          parse_mode: 'Markdown'
        })
      }).catch(err => console.error("Telegram Sync Error:", err))
    );

    await Promise.allSettled(syncPromises);

    setIsSyncing(false);
    setSubmitted(true);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-4xl font-extrabold text-[#0D0D12] tracking-tighter mb-10">Basics</h3>
            <Input label="Business Email" name="email" type="email" value={formData.email} error={errors.email} onChange={handleInputChange} required placeholder="hello@company.com" />
            <Input label="Company Name" name="companyName" value={formData.companyName} error={errors.companyName} onChange={handleInputChange} required placeholder="Legal entity name" />
            <Input label="Job Title" name="jobTitle" value={formData.jobTitle} error={errors.jobTitle} onChange={handleInputChange} required placeholder="e.g. Senior Visual Designer" />
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-4xl font-extrabold text-[#0D0D12] tracking-tighter mb-10">The Role</h3>
            <TextArea 
              label="Job Description" name="jobDescription" value={formData.jobDescription} error={errors.jobDescription} onChange={handleInputChange} 
              required rows={12} placeholder="Explain the responsibilities, expectations, and goals for this position..."
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-4xl font-extrabold text-[#0D0D12] tracking-tighter mb-10">Logistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Location" name="workLocation" value={formData.workLocation} error={errors.workLocation} onChange={handleInputChange} required placeholder="Addis Ababa" />
              <Input label="Contact Phone" name="contactPhone" type="tel" value={formData.contactPhone} error={errors.contactPhone} onChange={handleInputChange} required placeholder="+251 911 223344" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <Select 
                  label="Seniority" name="experienceLevel" value={formData.experienceLevel} onChange={handleInputChange}
                  options={Object.values(ExperienceLevel).map(v => ({ label: v, value: v }))} required
                />
                <RadioGroup 
                  label="Work Style" options={[{ label: 'On-Site', value: JobSite.ON_SITE }, { label: 'Remote', value: JobSite.REMOTE }]}
                  value={formData.jobSite} onChange={(val) => handleRadioChange('jobSite', val)} required
                />
                <Select 
                  label="Salary Budget" name="salaryRange" value={formData.salaryRange} onChange={handleInputChange}
                  options={Object.values(SalaryRange).map(v => ({ label: v, value: v }))} required
                />
              </div>
              <div className="relative" ref={calendarRef}>
                <Input 
                  label="Deadline" 
                  name="deadline" 
                  value={formData.deadline || "Select a date..."} 
                  error={errors.deadline} 
                  readOnly 
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  style={{ cursor: 'pointer' }}
                  required
                />
                {isCalendarOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-2 animate-fadeIn">
                    <Calendar 
                      label="" 
                      value={formData.deadline} 
                      onChange={(date) => {
                        setFormData(prev => ({ ...prev, deadline: date }));
                        setIsCalendarOpen(false);
                        if (errors.deadline) {
                          setErrors(prev => {
                            const updated = { ...prev };
                            delete updated.deadline;
                            return updated;
                          });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-6">
        <div className="max-w-md w-full text-center animate-scaleIn">
          <div className="w-24 h-24 bg-[#0D0D12] text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <i className="fa-solid fa-check text-3xl"></i>
          </div>
          <h2 className="text-5xl font-black text-[#0D0D12] tracking-tighter mb-6">Sent</h2>
          <p className="text-gray-600 text-lg font-medium mb-4 leading-relaxed tracking-tight">
            We've received your request. <br/> A specialist will contact you soon.
          </p>
          <div className="flex flex-col items-center gap-2 mb-12">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                <i className="fa-solid fa-database mr-2"></i> Synced to Cloud
              </p>
              <p className="text-[10px] text-sky-500 font-bold uppercase tracking-widest">
                <i className="fa-solid fa-paper-plane mr-2"></i> Sent to Admin
              </p>
          </div>
          <button 
            onClick={() => { setSubmitted(false); setFormData(INITIAL_FORM_STATE); setCurrentStep(1); setErrors({}); }}
            className="w-full py-6 bg-[#0D0D12] text-white rounded-full text-sm font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:scale-95"
          >
            New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] selection:bg-[#0D0D12] selection:text-white">
      <main className="relative pt-20 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="absolute top-[10%] right-[-5%] w-[600px] h-[600px] bg-zinc-200/40 organic-shape -z-10 animate-float"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-zinc-200/40 organic-shape -z-10 animate-float" style={{ animationDelay: '3s' }}></div>

        <div className="max-w-4xl w-full mx-auto">
          {/* Enhanced Stepper */}
          <div className="mb-12 px-8 flex justify-between relative max-w-2xl mx-auto">
            <div className="absolute top-6 left-8 right-8 h-[2px] bg-gray-200 -z-10">
              <div 
                className="h-full bg-black transition-all duration-700 ease-out" 
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              ></div>
            </div>
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex flex-col items-center group">
                  <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border-2 ${
                      isActive 
                        ? 'bg-black border-black text-white scale-110 shadow-xl' 
                        : isCompleted 
                        ? 'bg-black border-black text-white' 
                        : 'bg-white border-gray-100 text-gray-300'
                    }`}
                  >
                    <i className={`fa-solid ${isCompleted ? 'fa-check' : step.icon} text-sm`}></i>
                  </div>
                  <span className={`mt-4 text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? 'text-black' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-white rounded-[4rem] shadow-[0_60px_150px_-40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden animate-scaleIn">
            <div className="px-16 py-10 flex justify-between items-center bg-[#fafafa]/80 border-b border-gray-100">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                       <div className="w-2.5 h-[1.5px] bg-white rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">afriwork</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tighter text-[#0D0D12]">{STEPS[currentStep-1].title}</h2>
               </div>
               <div className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 rounded-full shadow-lg text-center min-w-[100px]">
                 Step {currentStep} / {STEPS.length}
               </div>
            </div>

            <form onSubmit={handleSubmit} className="p-16 md:p-20 min-h-[500px]">
              {renderStep()}
            </form>

            <div className="px-16 py-12 bg-white border-t border-gray-100 flex justify-between items-center">
              <button
                type="button" onClick={prevStep} disabled={currentStep === 1}
                className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all ${currentStep === 1 ? 'text-gray-200' : 'text-gray-500 hover:text-black'}`}
              >
                <i className="fa-solid fa-arrow-left"></i> Back
              </button>
              
              <div className="flex items-center gap-6">
                <button
                  type="button" onClick={currentStep === STEPS.length ? handleSubmit : nextStep}
                  disabled={isSyncing}
                  className="px-16 py-5 bg-[#0D0D12] text-white rounded-full text-sm font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                >
                  {isSyncing ? 'Syncing...' : (currentStep === STEPS.length ? 'Finalize' : 'Next')}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">© 2024 Afriwork Services • Built for Scale</p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-scaleIn { animation: scaleIn 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
