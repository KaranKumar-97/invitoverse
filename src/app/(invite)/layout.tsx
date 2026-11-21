import { ForceLightTheme } from "@/components/ForceLightTheme";

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ForceLightTheme />
      {children}
    </>
  );
}
