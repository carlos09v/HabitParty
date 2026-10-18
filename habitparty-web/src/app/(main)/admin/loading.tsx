import { Loading } from "@/components/ui/Loading";

export default function AdminLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
      <Loading size="lg" label="Carregando dados administrativos..." />
    </div>
  );
}
