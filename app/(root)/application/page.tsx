"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

export default function ApplicationPage() {
  const searchParams = useSearchParams();
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

  const onSubmit = async (values: z.infer<typeof applicationSchema>) => {
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, propertySlug }),
    });
    setSubmitted(true);
  };

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
                    <Input placeholder="Mobile phone" {...field} />
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
                  <Input placeholder="Social Security Number" {...field} />
                </FormControl>
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

          <Button type="submit" className="w-full">
            Submit Application
          </Button>
        </form>
      </Form>
    </div>
  );
}
