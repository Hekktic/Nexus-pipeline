"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProfitScenario, updateProfitScenario } from "@/app/actions";
import Field from "@/components/Field";
import AdvancedForm, { ADVANCED_DEFAULTS } from "@/components/calculator/AdvancedForm";
import QuickForm, { QUICK_DEFAULTS } from "@/components/calculator/QuickForm";
import ResultsPanel from "@/components/calculator/ResultsPanel";
import DealHealthCard from "@/components/calculator/DealHealthCard";
import ScenariosList from "@/components/calculator/ScenariosList";
import ComparisonTable from "@/components/calculator/ComparisonTable";
import { computeAdvanced } from "@/lib/calculators/advanced";
import { computeQuick } from "@/lib/calculators/quick";
import { dealHealth } from "@/lib/calculators/health";

export default function ProfitCalculator({ brands = [], creators = [], scenarios = [] }) {
  const router = useRouter();
  const [mode, setMode] = useState("quick");
  const [quickInputs, setQuickInputs] = useState(QUICK_DEFAULTS);
  const [advancedInputs, setAdvancedInputs] = useState(ADVANCED_DEFAULTS);

  const [editingScenarioId, setEditingScenarioId] = useState(null);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioBrandId, setScenarioBrandId] = useState("");
  const [scenarioCreatorId, setScenarioCreatorId] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const [selectedIds, setSelectedIds] = useState(new Set());

  const inputs = mode === "quick" ? quickInputs : advancedInputs;

  const result = useMemo(() => {
    return mode === "quick" ? computeQuick(quickInputs) : computeAdvanced(advancedInputs);
  }, [mode, quickInputs, advancedInputs]);

  const health = useMemo(() => {
    if (!result.ok) return null;
    return dealHealth({ mode, inputs, outputs: result.outputs });
  }, [mode, inputs, result]);

  const changeQuick = (key, value) => setQuickInputs((f) => ({ ...f, [key]: value }));
  const changeAdvanced = (key, value) => setAdvancedInputs((f) => ({ ...f, [key]: value }));

  const startNewScenario = (newMode) => {
    setMode(newMode);
    setEditingScenarioId(null);
    setScenarioName("");
    setScenarioBrandId("");
    setScenarioCreatorId("");
  };

  const editScenario = (scenario) => {
    setMode(scenario.mode);
    if (scenario.mode === "quick") setQuickInputs({ ...QUICK_DEFAULTS, ...scenario.inputs });
    else setAdvancedInputs({ ...ADVANCED_DEFAULTS, ...scenario.inputs });
    setEditingScenarioId(scenario.id);
    setScenarioName(scenario.name);
    setScenarioBrandId(scenario.brand_id || "");
    setScenarioCreatorId(scenario.creator_id || "");
    setCreatedBy(scenario.created_by || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingScenarioId(null);
    setScenarioName("");
    setScenarioBrandId("");
    setScenarioCreatorId("");
  };

  const saveScenario = () => {
    setSaveError("");
    if (!scenarioName.trim()) {
      setSaveError("Give this scenario a name.");
      return;
    }
    if (!result.ok) {
      setSaveError("Fix the errors above before saving.");
      return;
    }

    const payload = {
      name: scenarioName,
      mode,
      inputs,
      brandId: scenarioBrandId || null,
      creatorId: scenarioCreatorId || null,
      createdBy,
    };

    startTransition(async () => {
      try {
        const response = editingScenarioId
          ? await updateProfitScenario(editingScenarioId, payload)
          : await createProfitScenario(payload);

        if (!response?.ok) {
          setSaveError(response?.error || "Couldn't save that scenario.");
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } catch (e) {
        setSaveError(e?.message || "Couldn't save that scenario.");
      }
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const selectedScenarios = scenarios.filter((s) => selectedIds.has(s.id));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <ModeToggle value="quick" current={mode} onClick={() => startNewScenario("quick")} label="Quick" />
            <ModeToggle value="advanced" current={mode} onClick={() => startNewScenario("advanced")} label="Advanced" />
          </div>
          {editingScenarioId && (
            <span className="flex items-center gap-2 text-xs text-slate-300">
              Editing &quot;{scenarioName}&quot;
              <button onClick={cancelEdit} className="underline hover:text-white">
                Cancel
              </button>
            </span>
          )}
        </div>

        {mode === "quick" ? (
          <QuickForm values={quickInputs} onChange={changeQuick} />
        ) : (
          <AdvancedForm values={advancedInputs} onChange={changeAdvanced} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ResultsPanel mode={mode} outputs={result.outputs} errors={result.errors} />
        <DealHealthCard health={health} />
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
        <p className="mb-3 text-sm font-semibold text-white">
          {editingScenarioId ? "Update this scenario" : "Save this scenario"}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Scenario name" required>
            <input className="input" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} placeholder="e.g. Acme Q4 — retainer option" />
          </Field>
          <Field label="Created by">
            <input className="input" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Connected brand">
            <select className="input" value={scenarioBrandId} onChange={(e) => setScenarioBrandId(e.target.value)}>
              <option value="">None</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Connected creator">
            <select className="input" value={scenarioCreatorId} onChange={(e) => setScenarioCreatorId(e.target.value)}>
              <option value="">None</option>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {saveError && <p className="mt-2 text-xs text-red-400">{saveError}</p>}

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={saveScenario}
            disabled={pending}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            {pending ? "Saving..." : editingScenarioId ? "Update scenario" : "Save scenario"}
          </button>
          {saved && <span className="text-xs text-emerald-400">Saved</span>}
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
        <p className="mb-3 text-sm font-semibold text-white">Saved scenarios</p>
        <ScenariosList
          scenarios={scenarios}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onEdit={editScenario}
          onChanged={() => router.refresh()}
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
          <p className="mb-3 text-sm font-semibold text-white">Comparison</p>
          <ComparisonTable scenarios={selectedScenarios} />
        </div>
      )}
    </div>
  );
}

function ModeToggle({ value, current, onClick, label }) {
  const active = value === current;
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-slate-700 text-white" : "border border-slate-800 bg-slate-900 text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
