'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, Calendar, FileText, Share2, Heart } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  contractorName: string;
  phone?: string | null;
  email?: string | null;
  subdomain: string;
}

export function QuickActions({
  contractorName,
  phone,
  email,
  subdomain,
}: QuickActionsProps) {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/${subdomain}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: contractorName,
          text: `Check out ${contractorName} on PropertyFlow`,
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Share this contractor with others',
      });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? 'Removed from saved' : 'Saved!',
      description: isSaved ? 'Contractor removed from your list' : 'Contractor added to your saved list',
    });
  };

  const actions = [
    ...(phone ? [{
      icon: Phone,
      label: 'Call',
      href: `tel:${phone}`,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      hoverBg: 'hover:bg-emerald-500/30',
    }] : []),
    ...(email ? [{
      icon: Mail,
      label: 'Email',
      href: `mailto:${email}`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      hoverBg: 'hover:bg-blue-500/30',
    }] : []),
    {
      icon: Share2,
      label: 'Share',
      onClick: handleShare,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
      hoverBg: 'hover:bg-violet-500/30',
    },
    {
      icon: Heart,
      label: isSaved ? 'Saved' : 'Save',
      onClick: handleSave,
      color: isSaved ? 'text-rose-400' : 'text-slate-400',
      bgColor: isSaved ? 'bg-rose-500/20' : 'bg-slate-500/20',
      hoverBg: 'hover:bg-rose-500/30',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex items-center justify-center gap-3 flex-wrap"
    >
      {actions.map((action, index) => {
        const content = (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${action.bgColor} ${action.hoverBg} border border-white/10 transition-all cursor-pointer`}
          >
            <action.icon className={`h-4 w-4 ${action.color}`} />
            <span className={`text-sm font-medium ${action.color}`}>{action.label}</span>
          </motion.div>
        );

        if ('href' in action && action.href) {
          return (
            <a key={index} href={action.href}>
              {content}
            </a>
          );
        }

        return (
          <button key={index} onClick={action.onClick}>
            {content}
          </button>
        );
      })}
    </motion.div>
  );
}
