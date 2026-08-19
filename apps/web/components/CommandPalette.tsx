"use client";

import { useRouter } from "next/navigation";
import { FileText, LayoutGrid, Mic, Palette, Shield, CreditCard } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useCommandPalette } from "@/components/CommandPaletteProvider";

interface CommandAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
}

const NAVIGATE_ACTIONS: CommandAction[] = [
  { label: "New SOW", href: "/dashboard/new", icon: FileText, keywords: "generate create transcript record" },
  { label: "My SOWs", href: "/dashboard/projects", icon: LayoutGrid, keywords: "projects list" },
  { label: "Record live meeting", href: "/dashboard/new", icon: Mic, keywords: "audio recorder microphone" },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard, keywords: "subscription plan stripe" },
  { label: "Branding", href: "/dashboard/settings/branding", icon: Palette, keywords: "logo colors white-label" },
  { label: "Admin", href: "/admin", icon: Shield, keywords: "stats users" },
];

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAVIGATE_ACTIONS.map((action) => (
            <CommandItem
              key={action.label}
              value={`${action.label} ${action.keywords ?? ""}`}
              onSelect={() => go(action.href)}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-end border-t border-border px-3 py-2">
        <CommandShortcut>Esc to close</CommandShortcut>
      </div>
    </CommandDialog>
  );
}
