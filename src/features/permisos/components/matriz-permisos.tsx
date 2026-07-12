"use client";

import * as React from "react";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import {
  PERMISSION_MODULES,
  MODULE_LABELS,
  type PermissionModule,
  type RolBase,
  ROL_LABELS,
} from "@/shared/config/permisos.constants";
import { updatePermisosRolAction } from "../actions/permisos.actions";
import { toast } from "sonner";

interface PermisoWithModule {
  pk_id_permiso: string;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  activo: boolean;
}

interface Asignaciones {
  [rol: string]: string[];
}

interface MatrizPermisosProps {
  permisos: PermisoWithModule[];
  asignaciones: Asignaciones;
}

const EDITABLE_ROLES: RolBase[] = ["supervisor", "recepcionista", "cajero"];

export function MatrizPermisos({ permisos, asignaciones }: MatrizPermisosProps) {
  const [pending, setPending] = React.useState(false);
  const [localAsignaciones, setLocalAsignaciones] = React.useState<Asignaciones>(asignaciones);
  const [dirty, setDirty] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>(EDITABLE_ROLES[0]);

  const isChecked = (rol: RolBase, permiso: string) => {
    if (rol === "administrador") return true;
    return localAsignaciones[rol]?.includes(permiso) ?? false;
  };

  const togglePermiso = (rol: RolBase, permiso: string) => {
    if (rol === "administrador") return;

    setLocalAsignaciones((prev) => {
      const current = prev[rol] || [];
      const exists = current.includes(permiso);
      return {
        ...prev,
        [rol]: exists
          ? current.filter((p) => p !== permiso)
          : [...current, permiso],
      };
    });
    setDirty(true);
  };

  const toggleAllInModule = (rol: RolBase, module: PermissionModule, active: boolean) => {
    if (rol === "administrador") return;

    const modulePermisos = permisos.flatMap((p) =>
      p.modulo === module && p.activo ? [p.pk_id_permiso] : []
    );

    setLocalAsignaciones((prev) => ({
      ...prev,
      [rol]: active
        ? [...new Set([...(prev[rol] || []), ...modulePermisos])]
        : (prev[rol] || []).filter((p) => !modulePermisos.includes(p)),
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      for (const rol of EDITABLE_ROLES) {
        await updatePermisosRolAction(rol, localAsignaciones[rol] || []);
      }
      toast.success("Permisos guardados correctamente", {
        description: "Los usuarios deben cerrar sesión y volver a entrar para ver los cambios.",
      });
      setDirty(false);
    } catch {
      toast.error("Error al guardar los permisos");
      setPending(false);
    }
  };

  const permisosPorModulo = PERMISSION_MODULES.reduce(
    (acc, modulo) => {
      acc[modulo] = permisos.filter((p) => p.modulo === modulo && p.activo);
      return acc;
    },
    {} as Record<PermissionModule, PermisoWithModule[]>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            ¿Qué puede hacer cada empleado?
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Selecciona el tipo de empleado en las pestañas de abajo y enciende o apaga las opciones según lo que necesites que hagan. 
            <br className="hidden sm:block" />
            <span className="font-medium text-amber-600 dark:text-amber-500">Nota: El administrador siempre tiene acceso total a todo el sistema.</span>
          </p>
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto font-semibold shadow-sm transition-all"
          onClick={handleSave}
          disabled={!dirty || pending}
        >
          {pending ? "Guardando cambios..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 rounded-lg mb-6 gap-1">
          {EDITABLE_ROLES.map((rol) => (
            <TabsTrigger
              key={rol}
              value={rol}
              className="text-base px-6 py-2.5 rounded-md data-active:bg-background data-active:shadow-sm data-active:text-primary font-medium transition-all"
            >
              {ROL_LABELS[rol]}
            </TabsTrigger>
          ))}
        </TabsList>

        {EDITABLE_ROLES.map((rol) => (
          <TabsContent key={rol} value={rol} className="space-y-6 mt-0 outline-none">
            {PERMISSION_MODULES.map((module) => {
              const modulePermisos = permisosPorModulo[module];
              if (modulePermisos.length === 0) return null;

              const allChecked = modulePermisos
                .filter((p) => p.activo)
                .every((p) => localAsignaciones[rol]?.includes(p.pk_id_permiso));

              return (
                <Card key={module} className="overflow-hidden border-muted/60 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="bg-muted/30 border-b pb-4 pt-4 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Badge variant="outline" className="font-semibold bg-background">
                            {MODULE_LABELS[module]}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Opciones relacionadas a {MODULE_LABELS[module].toLowerCase()}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center space-x-3 shrink-0 bg-background px-4 py-2.5 rounded-lg border shadow-sm">
                        <Label 
                          htmlFor={`${rol}-${module}-all`} 
                          className="text-sm font-medium cursor-pointer select-none"
                        >
                          {allChecked ? "Desactivar todo" : "Activar todo el módulo"}
                        </Label>
                        <Switch
                          id={`${rol}-${module}-all`}
                          checked={allChecked}
                          onCheckedChange={(checked) => toggleAllInModule(rol, module, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-muted/40">
                      {modulePermisos.map((permiso) => {
                        const checked = isChecked(rol, permiso.pk_id_permiso);
                        return (
                          <div
                            key={permiso.pk_id_permiso}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 hover:bg-muted/10 transition-colors"
                          >
                            <div className="flex flex-col space-y-1.5 flex-1 pr-4">
                              <Label 
                                htmlFor={`${rol}-${permiso.pk_id_permiso}`}
                                className="text-base font-semibold leading-none cursor-pointer"
                              >
                                {permiso.nombre}
                              </Label>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {permiso.descripcion}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-center h-full">
                              <Switch
                                id={`${rol}-${permiso.pk_id_permiso}`}
                                checked={checked}
                                onCheckedChange={() => togglePermiso(rol, permiso.pk_id_permiso)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Sticky Bottom Bar for Mobile or long pages */}
      {dirty && (
        <div className="sticky bottom-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-background p-4 rounded-xl border shadow-lg animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <p className="text-sm font-medium">
              Tienes cambios sin guardar. No olvides guardarlos.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto font-semibold"
            onClick={handleSave}
            disabled={pending}
          >
            {pending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}
    </div>
  );
}