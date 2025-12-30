'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Building2, Key, Wrench, Users, HousePlus,
  ChevronRight, Sparkles 
} from 'lucide-react';

interface RoleSelectionClientProps {
  userName: string;
}

const roles = [
  {
    id: 'homeowner',
    title: "I'm a homeowner",
    description: 'Hire contractors for repairs, renovations, and home maintenance',
    icon: HousePlus,
    color: 'from-sky-500 to-blue-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    hoverBorder: 'hover:border-sky-500/60',
  },
  {
    id: 'tenant',
    title: "I'm looking to rent",
    description: 'Find your next home, pay rent online, and submit maintenance requests',
    icon: Home,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/60',
  },
  {
    id: 'existing_tenant',
    title: "I'm an existing tenant",
    description: 'My landlord asked me to sign up to manage my rental',
    icon: Key,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/60',
  },
  {
    id: 'landlord',
    title: "I'm a landlord or property manager",
    description: 'Manage properties, collect rent, and handle maintenance',
    icon: Building2,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-500/60',
  },
  {
    id: 'agent',
    title: "I'm a real estate agent",
    description: 'List properties for sale, manage leads, and grow your business',
    icon: Users,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/60',
  },
  {
    id: 'contractor',
    title: "I'm a contractor",
    description: 'Get work orders, track jobs, and receive payments',
    icon: Wrench,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    hoverBorder: 'hover:border-rose-500/60',
  },
];

export default function RoleSelectionClient({ userName }: RoleSelectionClientProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setIsNavigating(true);
    
    // Navigate to role-specific onboarding
    setTimeout(() => {
      router.push(`/onboarding/${roleId}`);
    }, 300);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 px-4 py-1.5 text-sm font-medium text-violet-300 ring-1 ring-violet-500/30">
            <Sparkles className="h-4 w-4" />
            Welcome to Property Flow HQ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Hey {userName.split(' ')[0]}! 👋
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Let's get you set up. What brings you here today?
          </p>
        </motion.div>

        {/* Role Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-4"
        >
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                onClick={() => handleRoleSelect(role.id)}
                disabled={isNavigating}
                className={`
                  relative w-full text-left rounded-2xl border p-5 transition-all duration-300
                  ${role.borderColor} ${role.hoverBorder}
                  ${isSelected ? `${role.bgColor} ring-2 ring-white/20` : 'bg-slate-900/50 hover:bg-slate-900/80'}
                  ${isNavigating && !isSelected ? 'opacity-50' : ''}
                  disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center
                    bg-gradient-to-br ${role.color} shadow-lg
                  `}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">
                      {role.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {role.description}
                    </p>
                  </div>
                  
                  <ChevronRight className={`
                    h-5 w-5 text-slate-500 transition-transform duration-300
                    ${isSelected ? 'translate-x-1 text-white' : ''}
                  `} />
                </div>
                
                {isSelected && (
                  <motion.div
                    layoutId="selected-indicator"
                    className="absolute inset-0 rounded-2xl ring-2 ring-white/30"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-sm text-slate-500"
        >
          You can always change this later in your settings
        </motion.p>
      </div>
    </main>
  );
}
