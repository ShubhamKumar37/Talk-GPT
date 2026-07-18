import { ModeToggle } from "@/components/ui/modeToggle";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div>
      <ModeToggle />
      <UserButton />
    </div>
  );
}
