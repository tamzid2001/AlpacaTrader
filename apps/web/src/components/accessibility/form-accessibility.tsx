import { ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function AccessibleFormField({
  label,
  error,
  description,
  required,
  children,
  className,
}: AccessibleFormFieldProps) {
  const fieldId = useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const descId = description ? `${fieldId}-description` : undefined;
  
  const describedBy = [errorId, descId].filter(Boolean).join(' ');

  return (
    <div className={cn("space-y-2", className)}>
      <label 
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div className="relative">
        {/* Clone children to add accessibility attributes */}
        {children && typeof children === 'object' && 'props' in children ? (
          // @ts-ignore - We're cloning with additional props
          children.type({
            ...children.props,
            id: fieldId,
            'aria-describedby': describedBy || undefined,
            'aria-invalid': !!error,
            'aria-required': required,
          })
        ) : (
          children
        )}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface AccessibleFieldsetProps {
  legend: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function AccessibleFieldset({
  legend,
  description,
  children,
  className,
}: AccessibleFieldsetProps) {
  const fieldsetId = useId();
  const descId = description ? `${fieldsetId}-description` : undefined;

  return (
    <fieldset 
      className={cn("space-y-4 border rounded-md p-4", className)}
      aria-describedby={descId}
    >
      <legend className="text-base font-semibold -ml-1 px-1">
        {legend}
      </legend>
      
      {description && (
        <p id={descId} className="text-sm text-muted-foreground -mt-2">
          {description}
        </p>
      )}
      
      {children}
    </fieldset>
  );
}

interface AccessibleFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function AccessibleForm({
  onSubmit,
  children,
  title,
  description,
  className,
}: AccessibleFormProps) {
  const formId = useId();
  const descId = description ? `${formId}-description` : undefined;

  return (
    <form 
      onSubmit={onSubmit}
      className={className}
      aria-labelledby={title ? `${formId}-title` : undefined}
      aria-describedby={descId}
      noValidate // We'll handle validation with ARIA
    >
      {title && (
        <h2 id={`${formId}-title`} className="text-lg font-semibold mb-4">
          {title}
        </h2>
      )}
      
      {description && (
        <p id={descId} className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
      )}
      
      {children}
    </form>
  );
}

export default AccessibleFormField;