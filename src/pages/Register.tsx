import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, CheckCircle2, Users, Loader2 } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  phone: z.string().min(10, "Please enter a valid phone number").max(20),
  organization: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  streetAddress: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  heardAboutUs: z.string().optional(),
  futureInterests: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

const courses = [
  {
    title: "Introduction to WordPress Website Development",
    description: "Learn to build professional websites from scratch",
    icon: "🌐",
  },
  {
    title: "Introduction to Digital Marketing",
    description: "Master online marketing strategies and tools",
    icon: "📱",
  },
  {
    title: "Introduction to AI Automation for Businesses",
    description: "Leverage AI to streamline business operations",
    icon: "🤖",
  },
];

const interestOptions = [
  { id: "cyber-security", label: "Cyber Security", category: "tech" },
  { id: "machine-learning", label: "Machine Learning / AI", category: "tech" },
  { id: "data-analytics", label: "Data Analytics", category: "tech" },
  { id: "cloud-computing", label: "Cloud Computing", category: "tech" },
  { id: "project-management", label: "Project Management", category: "business" },
  { id: "entrepreneurship", label: "Entrepreneurship", category: "business" },
  { id: "leadership", label: "Leadership Development", category: "business" },
  { id: "financial-literacy", label: "Financial Literacy", category: "business" },
];

const heardAboutOptions = [
  { value: "social-media", label: "Social Media" },
  { value: "friend-colleague", label: "Friend/Colleague" },
  { value: "search-engine", label: "Search Engine" },
  { value: "email-newsletter", label: "Email Newsletter" },
  { value: "already-member", label: "Already a member" },
  { value: "other", label: "Other" },
];

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      organization: "",
      jobTitle: "",
      streetAddress: "",
      city: "",
      country: "",
      heardAboutUs: "",
      futureInterests: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: data.fullName, email: data.email, phone: data.phone, organization: data.organization, jobTitle: data.jobTitle, streetAddress: data.streetAddress, city: data.city, country: data.country, heardAboutUs: data.heardAboutUs, futureInterests: data.futureInterests }) })
      if (!r.ok) throw new Error('Registration failed')
      const resp = await r.json()

      setIsSuccess(true);
      toast({
        title: "Registration Submitted!",
        description: resp.emailSent ? "Please check your email to verify your registration." : "Email delivery is unavailable. Use the verification link below to complete registration.",
      });
      if (!resp.emailSent && resp.verificationLink) {
        navigator.clipboard?.writeText(resp.verificationLink).catch(() => {})
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center animate-fade-in">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              Check Your Email!
            </h1>
            <p className="text-muted-foreground mb-4">
              We've sent a verification link to your email address. 
              Please click the link to complete your registration.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              The link will expire in 24 hours. If you don't see the email, check your spam folder.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            FREE Training Program
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Digital Skills Mastery Course
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            In partnership with USLACC, Dependify LLC presents a comprehensive training program 
            to equip you with essential digital skills.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Calendar className="w-5 h-5 text-primary" />
                  Training Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-display font-semibold text-foreground">
                  December 2025
                </p>
                <p className="text-muted-foreground mt-2">
                  4 intensive, hands-on learning sessions
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Courses Included
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.map((course, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-2xl">{course.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{course.title}</p>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="text-2xl font-display">Registration Form</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-display font-semibold text-foreground">Personal Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="heardAboutUs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How did you hear about us?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {heardAboutOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="font-display font-semibold text-foreground">Professional Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization/Company</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Marketing Manager" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="font-display font-semibold text-foreground">Address</h3>
                    
                    <FormField
                      control={form.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Future Training Interests */}
                  <div className="space-y-4">
                    <h3 className="font-display font-semibold text-foreground">
                      Future Training Interests
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select topics you'd be interested in learning about in future programs
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-primary">Tech-Focused</p>
                        {interestOptions
                          .filter((opt) => opt.category === "tech")
                          .map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="futureInterests"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, option.id]);
                                        } else {
                                          field.onChange(current.filter((v) => v !== option.id));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-secondary">Business-Focused</p>
                        {interestOptions
                          .filter((opt) => opt.category === "business")
                          .map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="futureInterests"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, option.id]);
                                        } else {
                                          field.onChange(current.filter((v) => v !== option.id));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
