import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => (
  <OTPInput ref={ref} containerClassName={cn("flex items-center gap-2", containerClassName)} className={className} {...props} />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef(({ index, className, ...props }, ref) => {
  const { slots } = React.useContext(OTPInputContext);
  const { char, isActive } = slots[index];
  return (
    <div ref={ref} className={cn("relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm first:rounded-l-md first:border-l last:rounded-r-md", isActive && "z-10 ring-2 ring-ring", className)} {...props}>
      {char}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

export { InputOTP, InputOTPGroup, InputOTPSlot };
