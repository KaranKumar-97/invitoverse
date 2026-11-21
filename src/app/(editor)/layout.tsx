import { StudioProviders } from "@/components/StudioProviders";

export default function EditorGroupLayout({ children }: { children: React.ReactNode }) {
  return <StudioProviders>{children}</StudioProviders>;
}
