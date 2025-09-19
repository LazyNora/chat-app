import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string;
  className?: string;
  fallBack?: string;
}

export const UserAvatar = ({ src, className, fallBack }: UserAvatarProps) => {
  return (
    <Avatar className={cn("h-7 w-7 md:h-10 md:w-10", className)}>
      <AvatarImage src={src} alt="User Avatar" />
      <AvatarFallback>{fallBack?.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};
