'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, Building2, Key, Wrench, Users, HousePlus,
  ChevronRight, Sparkles, Crown
} from 'lucide-react';

interface RoleSelectionClientProps {
  userName: string;
}

// Featured role - Property Manager/Landlord (shown first and prominently)
const featuredRole = {
  id: 'landlord',
  title: 'Property Manager',
  subtitle: 'or Landlord',
  description: 'Manage properties, collect rent, screen tenants, and handle maintenance all in one place',
  icon: Building2,
  color: 'from-violet-500 to-purple-500',
  bgColor: 'bg-violet-500/10',
  borderColor: 'border-violet-500/50',
  hoverBorder: 'hover:border-violet-400',
};

// Other roles in a 2-column grid
const roles = [
  {
    id: 'homeowner',
    title: 'Homeowner',
    description: 'Hire contractors for repairs & renovations',
    icon: HousePlus,
    color: 'from-sky-500 to-blue-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    hoverBorder: 'hover:border-sky-500/60',
  },
  {
    id: 'tenant',
    title: 'Looking to Rent',
    description: 'Find your next home & pay rent online',
    icon: Home,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/60',
  },
  {
    id: 'existing_tenant',
    title: 'Existing Tenant',
    description: 'Invited by my landlord to sign up',
    icon: Key,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/60',
  },
  {
    id: 'agent',
    title: 'Real Estate Agent',
    description: 'List properties & manage leads',
    icon: Users,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/60',
  },
  {
    id: 'contractor',
    title: 'Contractor',
    description: 'Get jobs & receive payments',
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

  const FeaturedIcon = featuredRole.icon;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-6">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 px-3 py-1 text-sm font-medium text-violet-300 ring-1 ring-violet-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome to Property Flow HQ
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Hey {userName.split(' ')[0]}! 👋
          </h1>
          <p className="text-base text-slate-400">
            What brings you here today?
          </p>
        </motion.div>

        {/* Featured Role - Property Manager */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          onClick={() => handleRoleSelect(featuredRole.id)}
          disabled={isNavigating}
          className={`
            relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-300
            ${featuredRole.borderColor} ${featuredRole.hoverBorder}
            ${selectedRole === featuredRole.id ? `${featuredRole.bgColor} ring-2 ring-white/20` : 'bg-gradient-to-br from-violet-950/50 to-slate-900/80 hover:from-violet-900/40 hover:to-slate-900'}
            ${isNavigating && selectedRole !== featuredRole.id ? 'opacity-50' : ''}
            disabled:cursor-not-allowed
          `}
        >
          {/* Featured badge */}
          <div className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-lg">
            <Crown className="h-3 w-3" />
            Most Popular
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`
              flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center
              bg-gradient-to-br ${featuredRole.color} shadow-lg shadow-violet-500/25
            `}>
              <FeaturedIcon className="h-7 w-7 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold text-white">
                  {featuredRole.title}
                </h3>
                <span className="text-sm text-violet-300">{featuredRole.subtitle}</span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                {featuredRole.description}
              </p>
            </div>
            
            <ChevronRight className={`
              h-5 w-5 text-violet-400 transition-transform duration-300
              ${selectedRole === featuredRole.id ? 'translate-x-1 text-white' : ''}
            `} />
          </div>
          
          {selectedRole === featuredRole.id && (
            <motion.div
              layoutId="selected-indicator"
              className="absolute inset-0 rounded-2xl ring-2 ring-white/30"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700/50" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">or select your role</span>
          <div className="flex-1 h-px bg-slate-700/50" />
        </div>

        {/* Other Role Cards - 2 column grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + 0.05 * index }}
                onClick={() => handleRoleSelect(role.id)}
                disabled={isNavigating}
                className={`
                  relative w-full text-left rounded-xl border p-3.5 transition-all duration-300
                  ${role.borderColor} ${role.hoverBorder}
                  ${isSelected ? `${role.bgColor} ring-2 ring-white/20` : 'bg-slate-900/50 hover:bg-slate-900/80'}
                  ${isNavigating && !isSelected ? 'opacity-50' : ''}
                  disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center
                    bg-gradient-to-br ${role.color}
                  `}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white leading-tight">
                      {role.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                      {role.description}
                    </p>
                  </div>
                </div>
                
                {isSelected && (
                  <motion.div
                    layoutId="selected-indicator"
                    className="absolute inset-0 rounded-xl ring-2 ring-white/30"
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
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-xs text-slate-500"
        >
          You can always change this later in your settings
        </motion.p>
      </div>
    </main>
  );
}
