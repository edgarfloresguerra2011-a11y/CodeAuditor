import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Target, 
  Book, 
  CheckCircle,
  Library
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NewProject() {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    type: "non-fiction",
    audience: "",
    tone: "",
    length: "standard"
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else setLocation("/project/new-id"); // Navigate to the project view
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else setLocation("/");
  };

  const steps = [
    { id: 1, title: "Core Concept", icon: Book },
    { id: 2, title: "Audience & Tone", icon: Target },
    { id: 3, title: "Configuration", icon: Library },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10" />
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = step >= s.id;
              const isCurrent = step === s.id;
              
              return (
                <div key={s.id} className="flex flex-col items-center bg-background px-2">
                  <div 
                    className={`
                      h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${isActive 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "bg-background border-border text-muted-foreground"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm min-h-[400px] flex flex-col">
              {step === 1 && (
                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">What are we writing today?</h2>
                    <p className="text-muted-foreground">Let's start with the big idea.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base">Working Title</Label>
                      <Input 
                        id="title" 
                        placeholder="e.g. The Cognitive Revolution" 
                        className="text-lg h-12"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">Format</Label>
                      <RadioGroup 
                        defaultValue="non-fiction" 
                        className="grid grid-cols-3 gap-4"
                        onValueChange={(val) => setFormData({...formData, type: val})}
                      >
                        <div className="relative">
                          <RadioGroupItem value="non-fiction" id="non-fiction" className="peer sr-only" />
                          <Label
                            htmlFor="non-fiction"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Book className="mb-3 h-6 w-6" />
                            Non-Fiction
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem value="fiction" id="fiction" className="peer sr-only" />
                          <Label
                            htmlFor="fiction"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Sparkles className="mb-3 h-6 w-6" />
                            Fiction
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem value="academic" id="academic" className="peer sr-only" />
                          <Label
                            htmlFor="academic"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Library className="mb-3 h-6 w-6" />
                            Academic
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Who is this for?</h2>
                    <p className="text-muted-foreground">Define your reader persona and voice.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="audience" className="text-base">Target Audience</Label>
                      <Textarea 
                        id="audience" 
                        placeholder="e.g. Senior software engineers looking to transition into management..." 
                        className="resize-none h-32 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tone" className="text-base">Tone & Voice</Label>
                      <Select>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="authoritative">Authoritative & Professional</SelectItem>
                          <SelectItem value="conversational">Conversational & Friendly</SelectItem>
                          <SelectItem value="academic">Academic & Rigorous</SelectItem>
                          <SelectItem value="inspirational">Inspirational & Uplifting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Final Configuration</h2>
                    <p className="text-muted-foreground">Set up your generation pipeline parameters.</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="font-medium">Model Selection</h3>
                      <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="model-draft">Drafting Model</Label>
                          <span className="text-xs text-muted-foreground">GPT-4o-mini</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="model-final">Polishing Model</Label>
                          <span className="text-xs text-primary font-medium">GPT-4o (Fine-tuned)</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Citation Strictness</h3>
                      <RadioGroup defaultValue="strict">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="strict" id="r1" />
                          <Label htmlFor="r1">Strict (Academic Standard)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="standard" id="r2" />
                          <Label htmlFor="r2">Standard (Journalistic)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="loose" id="r3" />
                          <Label htmlFor="r3">Creative (No citations)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 text-blue-900 p-4 rounded-lg border border-blue-100 text-sm flex gap-3">
                    <Sparkles className="h-5 w-5 shrink-0 text-blue-600" />
                    <div>
                      <strong>Ready to generate outline?</strong>
                      <p className="mt-1">This will consume approximately 800 tokens to generate a comprehensive chapter outline.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {step === 1 ? "Cancel" : "Back"}
                </Button>
                <Button onClick={handleNext} size="lg" className="px-8">
                  {step === 3 ? "Generate Outline" : "Next"}
                  {step !== 3 && <ArrowRight className="ml-2 h-4 w-4" />}
                  {step === 3 && <Sparkles className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
