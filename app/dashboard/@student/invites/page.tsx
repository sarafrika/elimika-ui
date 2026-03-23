import { Mail } from "lucide-react";

function InvitesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="bg-muted rounded-full p-5">
        <Mail className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">No invites</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          You don't have any pending invites right now. Check back later.
        </p>
      </div>
    </div>
  );
}

export default InvitesPage;