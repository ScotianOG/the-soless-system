import React, { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

// Custom X (formerly Twitter) icon component
const TwitterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
  </svg>
);

const ApplicationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("https://formspree.io/f/xpwzelod", {
        // Replace with your FormSpree form ID
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setSubmitStatus("success");
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 bg-black/30 border border-soless-blue/40 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-soless-blue mb-6 text-center">
        Apply for Partnership
      </h2>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
        <input
          type="hidden"
          name="_subject"
          value="New Partnership Application"
        />

        <div className="space-y-2">
          <label className="text-sm text-gray-300 block">Your Name</label>
          <Input
            name="name"
            required
            className="bg-black/50 border-soless-blue/40 text-gray-200 placeholder:text-gray-500"
            placeholder="Enter your name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300 block">Token Name</label>
          <Input
            name="tokenName"
            required
            className="bg-black/50 border-soless-blue/40 text-gray-200 placeholder:text-gray-500"
            placeholder="Enter your token name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300 block">Website</label>
          <Input
            name="website"
            type="url"
            required
            className="bg-black/50 border-soless-blue/40 text-gray-200 placeholder:text-gray-500"
            placeholder="https://"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300 block">
            Telegram Contact
          </label>
          <Input
            name="telegramContact"
            required
            className="bg-black/50 border-soless-blue/40 text-gray-200 placeholder:text-gray-500"
            placeholder="@username"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-soless-blue to-soless-purple hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>

        {submitStatus === "success" && (
          <p className="text-green-500 text-center text-sm">
            Application submitted successfully! We'll be in touch soon.
          </p>
        )}

        {submitStatus === "error" && (
          <p className="text-red-500 text-center text-sm">
            There was an error submitting your application. Please try again or
            contact us directly.
          </p>
        )}
      </form>

      <div className="mt-8 pt-8 border-t border-soless-blue/20">
        <p className="text-center text-gray-400 text-sm">
          You can also reach out to us directly:
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4">
          <a
            href="mailto:team@soless.app"
            className="flex items-center text-gray-300 hover:text-soless-blue"
          >
            <Mail className="h-5 w-5 mr-2" />
            team@soless.app
          </a>
          <a
            href="https://twitter.com/SOLessSystem"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-300 hover:text-soless-blue"
          >
            <TwitterIcon className="h-5 w-5 mr-2" />
            @SOLessSystem
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
