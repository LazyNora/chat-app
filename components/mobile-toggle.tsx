import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import NavigationSidebar from "@/components/navigation/navigation-sidebar";
import { ServerSidebar } from "@/components/servers/server-sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface MobileToggleProps {
  serverId: string;
}

export const MobileToggle = ({ serverId }: MobileToggleProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 flex gap-0 w-80 ">
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
        </VisuallyHidden>
        <div className="flex h-full">
          <div className="w-[72px]">
            <NavigationSidebar />
          </div>
          <div className="flex-1">
            <ServerSidebar serverId={serverId} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
