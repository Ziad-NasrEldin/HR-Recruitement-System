import { auth, signOut } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MobileSidebar } from "./mobile-sidebar";
import { LogOut } from "lucide-react";
import { ROLE_LABELS } from "@/types";

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  const displayName = session.user.name ?? session.user.email ?? "?";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <MobileSidebar role={session.user.role} />
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <DropdownMenu>
          {/*
            base-nova: DropdownMenuTrigger is @base-ui/react/menu Trigger which renders a <button>.
            No asChild needed — place Avatar directly inside; the trigger button wraps it.
          */}
          <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user.name ?? session.user.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Badge variant="secondary" className="text-xs">
                {ROLE_LABELS[session.user.role]}
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/*
              base-nova: DropdownMenuItem renders a <div>. For the sign-out form we use the
              render prop to make it a <button type="submit"> so it submits the surrounding form.
            */}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <DropdownMenuItem
                render={<button type="submit" className="w-full cursor-pointer" />}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
