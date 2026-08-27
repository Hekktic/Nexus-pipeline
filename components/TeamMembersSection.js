"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  createTeamMember,
  setTeamMemberActive,
  updateTeamMember,
} from "@/app/actions";
import Field from "@/components/Field";

export default function TeamMembersSection({ members = [] }) {
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError("");
    if (!displayName.trim() || pending) return;

    startTransition(async () => {
      const result = await createTeamMember({ displayName, role });
      if (!result?.ok) {
        setError(result?.error || "Couldn't save that. Try again.");
        return;
      }
      setDisplayName("");
      setRole("");
    });
  };

  const active = members.filter((m) => m.is_active);
  const inactive = members.filter((m) => !m.is_active);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
        <p className="mb-3 text-sm font-medium text-slate-200">Add a team member</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Name">
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full name"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </Field>
          <Field label="Role">
            <input
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Closer, Logger, Admin"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </Field>
          <div className="flex items-end">
            <button
              onClick={submit}
              disabled={pending || !displayName.trim()}
              className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950">
        <p className="border-b border-slate-800 px-4 py-3 text-sm font-medium text-slate-200">
          Active ({active.length})
        </p>
        {active.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No team members yet — add one above.
          </p>
        ) : (
          <div className="divide-y divide-slate-800">
            {active.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>

      {inactive.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-950">
          <p className="border-b border-slate-800 px-4 py-3 text-sm font-medium text-slate-500">
            Inactive ({inactive.length})
          </p>
          <div className="divide-y divide-slate-800">
            {inactive.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberRow({ member }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(member.display_name);
  const [role, setRole] = useState(member.role || "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (fn) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  const save = () =>
    run(async () => {
      const result = await updateTeamMember(member.id, { displayName, role });
      if (result?.ok) setEditing(false);
      return result;
    });

  const toggleActive = () => run(() => setTeamMemberActive(member.id, !member.is_active));

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <input
          className="input-sm"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Name"
        />
        <input
          className="input-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role"
        />
        <button
          onClick={save}
          disabled={pending || !displayName.trim()}
          className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded-md px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          Cancel
        </button>
        {error && <p className="w-full text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-200">{member.display_name}</p>
        {member.role && <p className="truncate text-xs text-slate-500">{member.role}</p>}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-300"
        title="Edit"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={toggleActive}
        disabled={pending}
        className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200 disabled:opacity-50"
      >
        {member.is_active ? "Deactivate" : "Reactivate"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
