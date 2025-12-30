"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { VerificationWizard } from "@/components/tenant/verification-wizard";

const phoneRegex = /^(\+1|1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  age: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().regex(phoneRegex, "Phone format: (555) 123-4567"),
  currentAddress: z.string().min(5, "Current address must be at least 5 characters"),
  currentEmployer: z.string().min(2, "Current employer must be at least 2 characters"),
  monthlySalary: z.string().optional(),
  yearlySalary: z.string().optional(),
  hasPets: z.string().optional(),
  petCount: z.string().optional(),
  ssn: z.string().regex(ssnRegex, "SSN format: XXX-XX-XXXX or XXXXXXXXX"),
  notes: z.string().optional(),
});

export default function ApplicationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const propertySlug = searchParams.get("property") ?? "";

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      age: "",
      email: "",
      phone: "",
      currentAddress: "",
      currentEmployer: "",
      monthlySalary: "",
      yearlySalary: "",
      hasPets: "",
      petCount: "",
      ssn: "",
      notes: "",
    },
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  // Pre-fill form with session data when available
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) form.setValue('fullName', session.user.name);
      if (session.user.email) form.setValue('email', session.user.email);
    }
  }, [session, form]);

  // Redirect to sign-up if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      const signUpUrl = propertySlug
        ? `/sign-up?fromProperty=true&propertySlug=${encodeURIComponent(propertySlug)}`
        : "/sign-up?fromProperty=true";
      router.push(signUpUrl);
    }
  }, [status, propertySlug, router]);

  const onSubmit = async (values: z.infer<typeof applicationSchema>) => {
    if (!session) {
      const signUpUrl = propertySlug
        ? `/sign-up?fromProperty=true&propertySlug=${encodeURIComponent(propertySlug)}`
        : "/sign-up?fromProperty=true";
      router.push(signUpUrl);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, propertySlug }),
      });

      if (res.status === 401) {
        const signUpUrl = propertySlug
          ? `/sign-up?fromProperty=true&propertySlug=${encodeURIComponent(propertySlug)}`
          : "/sign-up?fromProperty=true";
        router.push(signUpUrl);
        return;
      }

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to submit application. Please try again.");
        return;
      }

      const data = await res.json();
      
      if (data.applicationId) {
        setDraftApplicationId(data.applicationId);
        setShowVerification(true);
      } else {
        // Fallback: fetch the latest application
        const appsRes = await fetch('/api/user/applications');
        if (appsRes.ok) {
          const apps = await appsRes.json();
          const latestApp = apps.applications?.[0];
          if (latestApp) {
            setDraftApplicationId(latestApp.id);
            setShowVerification(true);
          } else {
            alert("Application created but unable to proceed to verification. Please check your dashboard.");
          }
        }
      }
    } catch (error) {
      console.error('Application error:', error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationComplete = () => {
    setSubmitted(true);
    setTimeout(() => {
      router.push("/user/dashboard");
    }, 3000);
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show verification wizard after form submission
  if (showVerification && draftApplicationId) {
    return (
      <VerificationWizard
        applicationId={draftApplicationId}
        onComplete={handleVerificationComplete}
      />
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Application submitted</h1>
        <p className="text-sm text-slate-600">
          Thank you for applying. Our team will review your application and contact you shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Rental Application</h1>
      {propertySlug && (
        <p className="text-xs text-slate-500 mb-4">For property: {propertySlug}</p>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Your full legal name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 29" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current address</FormLabel>
                <FormControl>
                  <Input placeholder="Street, city, state, ZIP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentEmployer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current employer</FormLabel>
                  <FormControl>
                    <Input placeholder="Employer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlySalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary per month</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 3,500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="yearlySalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary per year</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 42,000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasPets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you have pets?</FormLabel>
                  <FormControl>
                    <Input placeholder="Yes or No" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="petCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How many pets?</FormLabel>
                <FormControl>
                  <Input placeholder="Number of pets" {...field} />
                </FormControl>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pet-friendly units include an additional $300 pet fee once per year.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ssn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SSN</FormLabel>
                <FormControl>
                  <Input placeholder="XXX-XX-XXXX" {...field} />
                </FormControl>
                <p className="text-[11px] text-slate-500 mt-1">
                  Your SSN is encrypted and stored securely. Used for background checks only.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional information</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional notes, move-in date, roommates, pets, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Continue to Verification"
            )}
          </Button>
          <p className="text-xs text-center text-slate-500 mt-2">
            Next step: Upload ID and income documents for verification
          </p>
        </form>
      </Form>
    </div>
  );
}
