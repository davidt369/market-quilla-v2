import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import { getPermisosConRolesAction } from "@/features/permisos/actions/permisos.actions";
import { MatrizPermisos } from "@/features/permisos/components/matriz-permisos";

export default async function PermisosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.rolBase !== "administrador") {
    redirect("/dashboard");
  }

  const { permisos, asignaciones } = await getPermisosConRolesAction();

  return (
    <div className="p-6">
      <MatrizPermisos permisos={permisos} asignaciones={asignaciones} />
    </div>
  );
}