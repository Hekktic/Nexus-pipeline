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
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <p className="mb-3 text-sm font-medium text-neutral-200">Add a team member</p>
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
              className="btn-accent flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-950">
        <p className="border-b border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-200">
          Active ({active.length})
        </p>
        {active.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            No team members yet — add one above.
          </p>
        ) : (
          <div className="divide-y divide-neutral-800">
            {active.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>

      {inactive.length > 0 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950">
          <p className="border-b border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-500">
            Inactive ({inactive.length})
          </p>
          <div className="divide-y divide-neutral-800">
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
          className="btn-accent rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded-md px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
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
        <p className="truncate text-sm text-neutral-200">{member.display_name}</p>
        {member.role && <p className="truncate text-xs text-neutral-500">{member.role}</p>}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300"
        title="Edit"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={toggleActive}
        disabled={pending}
        className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200 disabled:opacity-50"
      >
        {member.is_active ? "Deactivate" : "Reactivate"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
