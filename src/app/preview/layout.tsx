import { ForceLightTheme } from "@/components/ForceLightTheme";

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ForceLightTheme />
      {children}
    </>
  );
}
