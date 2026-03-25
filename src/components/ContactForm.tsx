import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  suburb: z.string().min(2, "Please enter your suburb or address"),
  propertyOwner: z.enum(["yes", "no"], { error: "Please select an option" }),
  wasteRemoval: z.enum(["yes", "no"], { error: "Please select an option" }),
  plantsPurchasing: z.enum(["yes", "no"], { error: "Please select an option" }),
  hiringDecision: z.enum(["researching", "thinking", "might_hire", "going_to_hire"], {
    error: "Please select an option",
  }),
  additionalDetails: z.string().max(2000).optional(),
  acceptTerms: z.literal(true).refine((v) => v === true, {
    message: "You must accept the terms to proceed",
  }),
});

type FormValues = z.infer<typeof schema>;

const yesNo = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const hiringOptions = [
  { value: "researching", label: "Just researching" },
  { value: "thinking", label: "Thinking about it" },
  { value: "might_hire", label: "Likely to hire" },
  { value: "going_to_hire", label: "Ready to proceed" },
];

const hiringLabels: Record<string, string> = {
  researching: "Just researching",
  thinking: "Thinking about it",
  might_hire: "Likely to hire",
  going_to_hire: "Ready to proceed",
};

function RadioGroup({
  name,
  options,
  register,
  error,
}: {
  name: string;
  options: { value: string; label: string }[];
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {options.map(({ value, label }) => (
          <label key={value} className="relative">
            <input type="radio" value={value} {...register(name)} className="peer sr-only" />
            <span className="block text-sm px-4 py-2 rounded border border-gray-200 cursor-pointer transition-colors peer-checked:border-[#006400] peer-checked:bg-green-50 peer-checked:text-[#006400] peer-checked:font-medium hover:border-gray-300">
              {label}
            </span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: import.meta.env.PUBLIC_WEB3FORMS_KEY,
          subject: `New enquiry from ${data.name} — ${data.suburb}`,
          from_name: "ImpressioNZ Outdoors Website",
          replyto: data.email,
          // Form fields formatted for the email
          Name: data.name,
          Email: data.email,
          Phone: data.phone || "Not provided",
          "Suburb / Address": data.suburb,
          "Property owner?": data.propertyOwner === "yes" ? "Yes" : "No",
          "Waste removal needed?": data.wasteRemoval === "yes" ? "Yes" : "No",
          "Plants purchasing needed?": data.plantsPurchasing === "yes" ? "Yes" : "No",
          "How soon to proceed?": hiringLabels[data.hiringDecision],
          "Additional details": data.additionalDetails || "—",
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Submission failed");
      setSubmitted(true);
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "Something went wrong. Please try again or call Rod directly."
      );
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <svg className="w-12 h-12 text-[#006400] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="font-serif text-2xl font-bold mb-2 text-[#006400]">Message sent</h2>
        <p className="text-gray-600">Thanks for getting in touch. Rod will get back to you within two business days.</p>
      </div>
    );
  }

  const inputCls = "w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006400] focus:border-transparent";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6" aria-label="Enquiry form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelCls}>Your name <span className="text-red-500" aria-hidden="true">*</span></label>
          <input id="name" type="text" autoComplete="name" aria-required="true" {...register("name")} className={inputCls} />
          {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Email address <span className="text-red-500" aria-hidden="true">*</span></label>
          <input id="email" type="email" autoComplete="email" aria-required="true" {...register("email")} className={inputCls} />
          {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className={labelCls}>Phone number</label>
          <input id="phone" type="tel" autoComplete="tel" {...register("phone")} className={inputCls} />
        </div>
        <div>
          <label htmlFor="suburb" className={labelCls}>Suburb / address <span className="text-red-500" aria-hidden="true">*</span></label>
          <input id="suburb" type="text" aria-required="true" {...register("suburb")} className={inputCls} />
          {errors.suburb && <p role="alert" className="mt-1 text-xs text-red-600">{errors.suburb.message}</p>}
        </div>
      </div>

      <fieldset>
        <legend className={labelCls}>Are you the property owner? <span className="text-red-500" aria-hidden="true">*</span></legend>
        <RadioGroup name="propertyOwner" options={yesNo} register={register} error={errors.propertyOwner?.message} />
      </fieldset>

      <fieldset>
        <legend className={labelCls}>Do you need waste removal? <span className="text-red-500" aria-hidden="true">*</span></legend>
        <RadioGroup name="wasteRemoval" options={yesNo} register={register} error={errors.wasteRemoval?.message} />
      </fieldset>

      <fieldset>
        <legend className={labelCls}>Do you need plants purchased? <span className="text-red-500" aria-hidden="true">*</span></legend>
        <RadioGroup name="plantsPurchasing" options={yesNo} register={register} error={errors.plantsPurchasing?.message} />
      </fieldset>

      <fieldset>
        <legend className={labelCls}>How soon are you looking to proceed? <span className="text-red-500" aria-hidden="true">*</span></legend>
        <RadioGroup name="hiringDecision" options={hiringOptions} register={register} error={errors.hiringDecision?.message} />
      </fieldset>

      <div>
        <label htmlFor="additionalDetails" className={labelCls}>
          Additional details or specific requirements
          <span className="text-gray-400 font-normal"> (photos can be sent after we reply)</span>
        </label>
        <textarea id="additionalDetails" rows={4} {...register("additionalDetails")} placeholder="Access notes, specific requirements, any questions for Rod" className={`${inputCls} resize-y`} />
        {errors.additionalDetails && <p role="alert" className="mt-1 text-xs text-red-600">{errors.additionalDetails.message}</p>}
      </div>

      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" aria-required="true" {...register("acceptTerms")} className="mt-0.5 accent-[#006400]" />
          <span className="text-sm text-gray-600">
            I have read and accept the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#006400] underline">terms and conditions</a>
            , including the booking deposit requirement.
          </span>
        </label>
        {errors.acceptTerms && <p role="alert" className="mt-1 text-xs text-red-600">{errors.acceptTerms.message}</p>}
      </div>

      {serverError && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{serverError}</p>}

      <button type="submit" disabled={isSubmitting} className="w-full bg-[#303a4d] hover:bg-[#006400] disabled:opacity-60 text-white font-bold py-3.5 rounded-[30px] transition-colors text-sm">
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
