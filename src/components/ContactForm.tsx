import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

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

function RadioGroup({
  name,
  options,
  register,
  error,
  grid,
}: {
  name: string;
  options: { value: string; label: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  error?: string;
  grid?: boolean;
}) {
  return (
    <div>
      <div className={grid ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"}>
        {options.map(({ value, label }) => (
          <label key={value} className="relative">
            <input type="radio" value={value} {...register(name)} className="peer sr-only" />
            <span className="block text-sm px-3 py-2 rounded-lg border border-gray-200 cursor-pointer transition-colors peer-checked:border-[#006400] peer-checked:bg-green-50 peer-checked:text-[#006400] peer-checked:font-medium hover:border-gray-300 text-center">
              {label}
            </span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    const errs: string[] = [];

    for (const file of Array.from(incoming)) {
      if (next.length >= MAX_FILES) {
        errs.push(`Maximum ${MAX_FILES} photos allowed`);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        errs.push(`${file.name}: only JPEG, PNG, WebP, or HEIC photos are accepted`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errs.push(`${file.name}: must be under ${MAX_SIZE_MB} MB`);
        continue;
      }
      next.push(file);
    }

    setFileError(errs[0] ?? "");
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const onSubmit = async (data: FormValues) => {
    setServerError("");

    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await toBase64(file),
      }))
    );

    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      suburb: data.suburb,
      propertyOwner: data.propertyOwner,
      wasteRemoval: data.wasteRemoval,
      plantsPurchasing: data.plantsPurchasing,
      hiringDecision: data.hiringDecision,
      additionalDetails: data.additionalDetails || undefined,
      files: encodedFiles.length > 0 ? encodedFiles : undefined,
    };

    try {
      const res = await fetch(`${import.meta.env.PUBLIC_WORKER_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006400] focus:border-transparent";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionHeadingCls = "text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6" aria-label="Enquiry form">

      {/* Contact details */}
      <div>
        <p className={sectionHeadingCls}>Your details</p>
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
      </div>

      {/* Qualification questions — 2×2 grid */}
      <div>
        <p className={sectionHeadingCls}>A few quick questions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset className="bg-gray-50 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 mb-2">Are you the property owner? <span className="text-red-500" aria-hidden="true">*</span></legend>
            <RadioGroup name="propertyOwner" options={yesNo} register={register} error={errors.propertyOwner?.message} />
          </fieldset>

          <fieldset className="bg-gray-50 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 mb-2">Do you need waste removal? <span className="text-red-500" aria-hidden="true">*</span></legend>
            <RadioGroup name="wasteRemoval" options={yesNo} register={register} error={errors.wasteRemoval?.message} />
          </fieldset>

          <fieldset className="bg-gray-50 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 mb-2">Do you need plants purchased? <span className="text-red-500" aria-hidden="true">*</span></legend>
            <RadioGroup name="plantsPurchasing" options={yesNo} register={register} error={errors.plantsPurchasing?.message} />
          </fieldset>

          <fieldset className="bg-gray-50 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 mb-2">How soon are you looking to proceed? <span className="text-red-500" aria-hidden="true">*</span></legend>
            <RadioGroup name="hiringDecision" options={hiringOptions} register={register} error={errors.hiringDecision?.message} grid />
          </fieldset>
        </div>
      </div>

      {/* Details & upload */}
      <div>
        <p className={sectionHeadingCls}>More detail</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="additionalDetails" className={labelCls}>
              Additional details or specific requirements
            </label>
            <textarea id="additionalDetails" rows={4} {...register("additionalDetails")} placeholder="Access notes, specific requirements, any questions for Rod" className={`${inputCls} resize-y`} />
            {errors.additionalDetails && <p role="alert" className="mt-1 text-xs text-red-600">{errors.additionalDetails.message}</p>}
          </div>

          <div>
            <label className={labelCls}>
              Photos <span className="text-gray-400 font-normal">(optional — up to {MAX_FILES}, {MAX_SIZE_MB} MB each)</span>
            </label>
            <div
              className="border border-dashed border-gray-300 rounded-lg px-4 py-8 text-center cursor-pointer hover:border-[#006400] transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              role="button"
              tabIndex={0}
              aria-label="Upload photos"
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, HEIC</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
                aria-hidden="true"
              />
            </div>

            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((file, i) => (
                  <li key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="truncate text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="ml-3 text-gray-400 hover:text-red-500 flex-shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {fileError && <p role="alert" className="mt-1 text-xs text-red-600">{fileError}</p>}
          </div>
        </div>
      </div>

      {/* Terms + submit */}
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" aria-required="true" {...register("acceptTerms")} className="mt-0.5 accent-[#006400]" />
          <span className="text-sm text-gray-600">
            I have read and accept the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#006400] underline">terms and conditions</a>
            , including the booking deposit requirement.
          </span>
        </label>
        {errors.acceptTerms && <p role="alert" className="mt-1 text-xs text-red-600">{errors.acceptTerms.message}</p>}

        {serverError && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="w-full bg-[#006400] hover:bg-[#303a4d] disabled:opacity-60 text-white font-bold py-3.5 rounded-[30px] transition-colors text-sm">
          {isSubmitting ? "Sending…" : "Send enquiry"}
        </button>
      </div>

    </form>
  );
}
