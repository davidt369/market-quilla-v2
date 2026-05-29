"use client"

import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { User } from "./user-table-wrapper"
import { useAuthStore } from "@/store/useAuthStore"
import { Loader2 } from "lucide-react"

interface Role {
  id: number;
  nombreRol: string;
}

interface UserFormDialogProps {
  isOpen: boolean
  setIsOpen: (val: boolean) => void
  user: User | null
  onSuccess: () => void
}

export function UserFormDialog({ isOpen, setIsOpen, user, onSuccess }: UserFormDialogProps) {
  const isEditing = !!user
  const { empresaId } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  
  const [formData, setFormData] = useState({
    nombreCompleto: user?.nombreCompleto || "",
    nombreUsuario: user?.nombreUsuario || "",
    password: "",
    rolBase: user?.rolBase || "recepcionista",
    rolId: user?.rolId?.toString() || "none",
  })

  useEffect(() => {
    if (isOpen && empresaId) {
      fetch(`/api/roles?empresaId=${empresaId}`)
        .then(res => res.json())
        .then(data => setRoles(data))
        .catch(() => toast.error("Error al cargar roles personalizados"))
    }
  }, [isOpen, empresaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload: any = {
        nombreCompleto: formData.nombreCompleto,
        nombreUsuario: formData.nombreUsuario,
        rolBase: formData.rolBase,
        rolId: formData.rolId === "none" ? null : parseInt(formData.rolId)
      }

      if (formData.password) {
        payload.password = formData.password
      } else if (!isEditing) {
        toast.error("La contraseña es obligatoria para nuevos usuarios")
        setIsLoading(false)
        return
      }

      const url = isEditing ? `/api/usuarios/${user.id}` : `/api/usuarios`
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al guardar el usuario")
      }

      toast.success(`Usuario ${isEditing ? 'actualizado' : 'creado'} exitosamente`)
      onSuccess()
      setIsOpen(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos y permisos del usuario." : "Agrega un nuevo miembro a tu empresa y configúrale un rol."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombreCompleto">Nombre Completo</Label>
            <Input 
              id="nombreCompleto" 
              value={formData.nombreCompleto}
              onChange={e => setFormData({...formData, nombreCompleto: e.target.value})}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nombreUsuario">Usuario (Login)</Label>
            <Input 
              id="nombreUsuario" 
              value={formData.nombreUsuario}
              onChange={e => setFormData({...formData, nombreUsuario: e.target.value})}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña"}</Label>
            <Input 
              id="password" 
              type="password"
              placeholder={isEditing ? "Déjalo en blanco para mantener la actual" : "••••••••"}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required={!isEditing} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nivel Base</Label>
              <Select value={formData.rolBase} onValueChange={v => setFormData({...formData, rolBase: v || ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="recepcionista">Recepcionista</SelectItem>
                  <SelectItem value="cajero">Cajero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rol (Permisos)</Label>
              <Select value={formData.rolId} onValueChange={v => setFormData({...formData, rolId: v || "none"})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin rol extra..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno (Sólo base)</SelectItem>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id.toString()}>{r.nombreRol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
