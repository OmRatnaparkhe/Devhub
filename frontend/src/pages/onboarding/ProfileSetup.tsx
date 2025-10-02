import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Loader2, User } from "lucide-react";
import { AvatarFallback, Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

const techRoles = [
  "Student",
  "Full Stack Web Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile App Developer",
  "DevOps Engineer",
  "Software Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "UI/UX Designer",
  "Product Manager",
  "QA Engineer",
  "Cloud Architect",
];

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  role: z.string({
    required_error: "Please select your role.",
  }),
  description: z.string().max(160, { message: "Description must not be longer than 160 characters." }).optional(),
  githubLink: z.string().url("Please provide a valid url"),
  profilePic: z.any().refine((file)=>!file||file instanceof File,"Must be valid file").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const ProfileSetup = () => {

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const {toast} = useToast()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      username: "",
      description: "",
    },
    mode: "onChange",
  });
  const {getToken} = useAuth();
async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    setError(null);

    try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("username", data.username);
        formData.append("role", data.role);
        formData.append("description", data.description ?? "");
        formData.append("githubLink", data.githubLink);
        if (data.profilePic) {
            formData.append("profilePic", data.profilePic);
        }
        
        const token = await getToken();
        
        const response = await fetch("http://localhost:3000/api/users/profile", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                
            },
            body: formData,
        
        });
       

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        const updatedProfile = await response.json(); 
        console.log("Profile updated successfully ✅", updatedProfile);
        navigate("/followUsers");

    } catch (err: any) {
        setError(err.message);
        console.error("Failed to update profile:", err);
    } finally {
        setIsLoading(false);
        toast({ title: "Profile updated ✅", description: "You can now follow others." });
    }
}

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 mt-14">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
          <CardDescription>
            Welcome! Let's get your profile ready so others can find you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Other FormFields remain the same */}
              
              <FormField
                control={form.control}
                name="profilePic"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem className="flex flex-col items-center text-center">
                    <FormLabel className="cursor-pointer flex flex-col items-center">
                      <Avatar className="h-24 w-24 mb-2 flex items-center">
                        <AvatarImage src={imagePreview ?? undefined} alt="Profile picture preview" />
                        <AvatarFallback>{form.getValues("name")?.[0] ?? <User className="h-12 w-12" />}</AvatarFallback>
                      </Avatar>
                      Click to upload a photo
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            setImagePreview(URL.createObjectURL(file));
                            onChange(file);
                          }
                        }}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormDescription>This is your unique handle on the platform.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary role" />
                        </SelectTrigger>
                      </FormControl>
                      {/* UPDATED: Wrap the content in a Portal */}
                      
                        <SelectContent position="popper">
                          {techRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      
                    </Select>
                    <FormDescription>
                      This helps others understand your background.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little bit about yourself"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of who you are and what you do.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="githubLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Profile</FormLabel>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="https://github.com/johndoe" {...field} className="pl-10" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;