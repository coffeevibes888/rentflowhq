"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircle2, ArrowRight, Shield, Zap, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const applicationSchema = z.object({
  fullName: z.string().min(3, "Name is required"),
  age: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Phone number is required"),
  currentAddress: z.string().min(5, "Current address is required"),
  currentEmployer: z.string().min(2, "Current employer is required"),
  monthlySalary: z.string().optional(),
  yearlySalary: z.string().optional(),
  hasPets: z.string().optional(),
  petCount: z.string().optional(),
  ssn: z.string().min(4, "SSN is required"),
  notes: z.string().optional(),
});

export default function SubdomainApplicationPage() {
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
  const [showSsn, setShowSsn] = useState(false);

  // Redirect to sign-up if not authenticated or not a tenant
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "tenant") {
      // User is authenticated and is a tenant, allow access
      return;
    } else if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "tenant")) {
      // Not authenticated or not a tenant, redirect to sign-up with propertySlug
      // After sign-up, a draft application will be created and they'll go to dashboard
      const signUpUrl = propertySlug
        ? `/sign-up?fromProperty=true&propertySlug=${encodeURIComponent(propertySlug)}`
        : "/sign-up?fromProperty=true";
      router.push(signUpUrl);
    }
  }, [status, session?.user?.role, propertySlug, router]);

  const onSubmit = async (values: z.infer<typeof applicationSchema>) => {
    if (!session || session.user?.role !== "tenant") {
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

      // Redirect to tenant dashboard after successful submission
      router.push("/user/dashboard");
      setSubmitted(true);
    } catch (error) {
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "tenant")) {
    return (
      <main className="flex-1 w-full flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-slate-200">Redirecting to sign up...</p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex-1 w-full">
        <div className="max-w-2xl mx-auto py-20 px-4">
          <Card className="border-emerald-400/30 bg-emerald-500/10">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Application Submitted!</h1>
                  <p className="text-slate-200/90">
                    Thank you for applying. Our team will review your application and contact you shortly.
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <p className="text-sm text-slate-300/80">
                    <strong>What happens next?</strong>
                  </p>
                  <ul className="text-sm text-slate-200/80 space-y-2 text-left max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                      <span>We'll review your application within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                      <span>You'll receive an email with next steps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                      <span>If approved, you can sign your lease online</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-600 transition-colors"
                >
                  Back to Listings
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full">
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Rental Application
          </h1>
          <p className="text-slate-200/80">
            {propertySlug 
              ? `Apply for ${propertySlug}`
              : "Complete your application in minutes - No fees, no hassle"}
          </p>
        </div>

        {/* Benefits Banner */}
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 mb-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">No Application Fees</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-200">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Fast Approval Process</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-200">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Secure & Encrypted</span>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Application Details</CardTitle>
            <CardDescription className="text-slate-300/80">
              Please fill out all required fields. Your information is secure and encrypted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Full name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your full legal name" 
                          {...field}
                          className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                        />
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
                        <FormLabel className="text-slate-200">Age</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. 29" 
                            {...field}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                          />
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
                        <FormLabel className="text-slate-200">Phone number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Mobile phone" 
                            {...field}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                          />
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
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Email address" 
                          type="email"
                          {...field}
                          className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                        />
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
                      <FormLabel className="text-slate-200">Current address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Street, city, state, ZIP" 
                          {...field}
                          className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                        />
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
                        <FormLabel className="text-slate-200">Current employer</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Employer name" 
                            {...field}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                          />
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
                        <FormLabel className="text-slate-200">Salary per month</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. 3,500" 
                            {...field}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                          />
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
                        <FormLabel className="text-slate-200">Salary per year</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. 42,000" 
                            {...field}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                          />
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
                        <FormLabel className="text-slate-200">Do you have pets?</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Yes or No" 
                            {...field}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                          />
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
                      <FormLabel className="text-slate-200">How many pets?</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Number of pets" 
                          {...field}
                          className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <p className="text-xs text-slate-300/80 mt-1">
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
                      <FormLabel className="text-slate-200">SSN</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Social Security Number" 
                            type={showSsn ? "text" : "password"}
                            {...field}
                            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSsn(!showSsn)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                            tabIndex={-1}
                          >
                            {showSsn ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <p className="text-xs text-slate-300/80 mt-1">
                        Your SSN is encrypted and stored securely. We use it for background checks only.
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
                      <FormLabel className="text-slate-200">Additional information</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Optional notes, move-in date, roommates, pets, etc." 
                          {...field}
                          className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400 min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-violet-500 hover:bg-violet-600 text-white py-6 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Application - No Fees
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
