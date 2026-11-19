import React from "react";

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Δεν έχεις πρόσβαση</h1>
        <p className="text-muted-foreground">Ο λογαριασμός σου δεν είναι εγγεγραμμένος σε αυτή την εφαρμογή.</p>
      </div>
    </div>
  );
}
