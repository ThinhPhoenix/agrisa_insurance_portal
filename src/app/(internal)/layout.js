import CustomSidebar from "@/components/custom-sidebar";

export default function InternalLayout({ children }) {
  return (
    <div className="flex h-screen">
      <CustomSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
