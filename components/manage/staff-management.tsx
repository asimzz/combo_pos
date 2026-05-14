'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { User } from '@prisma/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Table } from '@/components/ui/table'
import { IconButton } from '@/components/ui/icon-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type Role = 'ADMIN' | 'MANAGER' | 'STAFF'

type FormState = {
  name: string
  phone: string
  password: string
  role: Role
}

const EMPTY: FormState = { name: '', phone: '', password: '', role: 'STAFF' }

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

function roleVariant(role: string): Variant {
  switch (role) {
    case 'ADMIN':
      return 'brand'
    case 'MANAGER':
      return 'info'
    case 'STAFF':
      return 'success'
    default:
      return 'neutral'
  }
}

export function StaffManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false))
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch {
      toast.error('Failed to load staff members')
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (user: User) => {
    setEditingId(user.id)
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      password: '',
      role: user.role as Role,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required')
      return
    }
    if (!editingId && !form.password) {
      toast.error('Password is required for new staff')
      return
    }
    setSubmitting(true)
    try {
      const payload: any = { name: form.name, phone: form.phone, role: form.role }
      if (form.password) payload.password = form.password

      const response = await fetch(editingId ? `/api/users/${editingId}` : '/api/users', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? payload : form),
      })
      if (!response.ok) throw new Error('Failed to save staff member')
      await fetchUsers()
      toast.success(editingId ? 'Staff updated' : 'Staff created')
      setSubmitting(false)
      closeForm()
    } catch {
      setSubmitting(false)
      toast.error('Failed to save staff member')
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete user')
      await fetchUsers()
      toast.success('Staff member deleted')
    } catch {
      toast.error('Failed to delete staff member')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Staff Management</h3>
          <p className="text-sm text-muted">Manage employees and their roles</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Add staff member
        </Button>
      </div>

      <Table>
        <Table.Header>
          <tr>
            <Table.HeaderCell>Staff Member</Table.HeaderCell>
            <Table.HeaderCell>Phone</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell>Joined</Table.HeaderCell>
            <Table.HeaderCell align="right">Actions</Table.HeaderCell>
          </tr>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Empty colSpan={5}>Loading…</Table.Empty>
          ) : users.length === 0 ? (
            <Table.Empty colSpan={5}>No staff members yet.</Table.Empty>
          ) : (
            users.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="font-medium">{user.name}</div>
                  </div>
                </Table.Cell>
                <Table.Cell>{user.phone}</Table.Cell>
                <Table.Cell>
                  <Badge variant={roleVariant(user.role)} size="sm">
                    {user.role}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="text-muted">
                  {new Date(user.createdAt).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell align="right">
                  <div className="flex justify-end gap-1">
                    <IconButton aria-label="Edit" onClick={() => openEdit(user)}>
                      <Edit className="h-4 w-4" />
                    </IconButton>
                    {user.role !== 'ADMIN' && (
                      <IconButton aria-label="Delete" variant="danger" onClick={() => setDeleteTarget(user)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingId ? 'Edit staff member' : 'Add staff member'}
        width="md"
        footer={
          <>
            <Button variant="outline" disabled={submitting} onClick={closeForm}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create staff'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Full name</label>
            <Input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Phone</label>
            <Input
              type="tel"
              placeholder="07XXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              {editingId ? 'New password (optional)' : 'Password'}
            </label>
            <Input
              type="password"
              placeholder={editingId ? 'Leave blank to keep current' : 'Password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Role</label>
            <Select<Role>
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v })}
              options={[
                { value: 'STAFF', label: 'Staff' },
                { value: 'MANAGER', label: 'Manager' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={performDelete}
        title="Delete staff member?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will lose access immediately. This cannot be undone.`
            : null
        }
        confirmLabel="Delete staff"
      />
    </div>
  )
}
