import React from "react";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <div className="text-center mb-6">
          <img src="/icons/icon-192.png" alt="Deal of Temptation" className="mx-auto mb-4 h-20 w-20 rounded-[22px]" />
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
